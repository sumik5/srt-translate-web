import { LMStudioModelsResponse } from './types';

export class APIClient {
    private apiUrl: string;

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
    }

    setApiUrl(url: string): void {
        this.apiUrl = url;
    }

    async getModels(): Promise<LMStudioModelsResponse> {
        try {
            const response = await fetch(`${this.apiUrl}/v1/models`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch models:', error);
            throw error;
        }
    }

    async translate(text: string, modelName: string, targetLanguage: string): Promise<string> {
        try {
            const response = await fetch(`${this.apiUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a subtitle translator. Translate the given SRT subtitle text to ${targetLanguage}. 
IMPORTANT: Translate EACH subtitle entry independently, line by line. Do NOT consider the overall context or try to make the subtitles flow together.
Each numbered subtitle block should be translated on its own without reference to other blocks.
Keep the exact same SRT format: number, timestamp, and translated text.
Return only the translated SRT text without any explanation.`
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000,
                    stream: false
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    }
}