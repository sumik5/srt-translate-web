import { SRTBlock } from './types';

export class SRTProcessor {
    parseSRT(content: string): SRTBlock[] {
        const blocks: SRTBlock[] = [];
        const srtBlocks = content.trim().split(/\n\s*\n/);

        for (const block of srtBlocks) {
            const lines = block.split('\n');
            if (lines.length >= 3) {
                const index = lines[0];
                const timestamp = lines[1];
                const subtitle = lines.slice(2).join(' ');
                
                blocks.push({
                    index,
                    timestamp,
                    subtitle
                });
            }
        }

        return blocks;
    }

    formatSRT(blocks: SRTBlock[]): string {
        return blocks
            .map(block => `${block.index}\n${block.timestamp}\n${block.subtitle}`)
            .join('\n\n');
    }

    createChunks(blocks: SRTBlock[], maxChunkSize: number): SRTBlock[][] {
        const chunks: SRTBlock[][] = [];
        let currentChunk: SRTBlock[] = [];
        let currentChunkTextLength = 0;
        
        for (const block of blocks) {
            const blockTextLength = block.subtitle.length + block.index.length + block.timestamp.length + 10; // +10 for newlines and spacing
            
            // If adding this block would exceed the max chunk size, start a new chunk
            if (currentChunkTextLength + blockTextLength > maxChunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk);
                currentChunk = [];
                currentChunkTextLength = 0;
            }
            
            currentChunk.push(block);
            currentChunkTextLength += blockTextLength;
        }
        
        // Don't forget the last chunk
        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
        }
        
        return chunks;
    }

    async translateSRT(
        content: string,
        translateFunc: (text: string) => Promise<string>,
        maxChunkSize: number = 2000
    ): Promise<string> {
        const blocks = this.parseSRT(content);
        const chunks = this.createChunks(blocks, maxChunkSize);
        const translatedBlocks: SRTBlock[] = [];
        
        console.log(`Processing ${blocks.length} blocks in ${chunks.length} chunks`);

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            console.log(`Translating chunk ${chunkIndex + 1}/${chunks.length} with ${chunk.length} blocks`);
            // Create a single SRT text from chunk with complete format
            const chunkSRT = this.formatSRT(chunk);
            
            try {
                // Translate the entire chunk at once (with complete SRT format)
                const translatedChunkSRT = await translateFunc(chunkSRT);
                
                // Parse the translated result back to blocks
                const translatedChunk = this.parseSRT(translatedChunkSRT);
                
                // Verify the translation maintained structure
                if (translatedChunk.length === chunk.length) {
                    // Successfully translated with structure preserved
                    for (let i = 0; i < chunk.length; i++) {
                        translatedBlocks.push({
                            index: chunk[i].index,
                            timestamp: chunk[i].timestamp,
                            subtitle: translatedChunk[i].subtitle
                        });
                    }
                } else {
                    // Structure mismatch - use original structure with translated text
                    console.warn(`Structure mismatch: expected ${chunk.length} blocks, got ${translatedChunk.length}`);
                    // Try to extract just the translated subtitles
                    for (let i = 0; i < chunk.length; i++) {
                        const translatedText = translatedChunk[i]?.subtitle || chunk[i].subtitle;
                        translatedBlocks.push({
                            index: chunk[i].index,
                            timestamp: chunk[i].timestamp,
                            subtitle: translatedText
                        });
                    }
                }
            } catch (error) {
                console.error(`Chunk ${chunkIndex + 1} translation failed:`, error);
                // If chunk translation fails completely, keep original
                for (const block of chunk) {
                    translatedBlocks.push({
                        ...block,
                        subtitle: block.subtitle // Keep original on error
                    });
                }
            }
        }

        return this.formatSRT(translatedBlocks);
    }
}