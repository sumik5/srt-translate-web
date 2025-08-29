import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const isWatch = process.argv.includes('--watch');
const isProd = process.env.NODE_ENV === 'production';

const buildOptions = {
    entryPoints: ['src/srt-translator-app.ts'],
    bundle: true,
    outfile: isProd ? 'srt-translator.min.js' : 'srt-translator.bundle.js',
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    sourcemap: !isProd,
    minify: isProd,
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    },
    loader: {
        '.ts': 'ts'
    },
    logLevel: 'info'
};

async function build() {
    try {
        if (isWatch) {
            const ctx = await esbuild.context(buildOptions);
            await ctx.watch();
            console.log('👀 Watching for changes...');
        } else {
            await esbuild.build(buildOptions);
            console.log('✅ Build complete');
        }
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

build();