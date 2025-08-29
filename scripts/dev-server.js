import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const serverProcess = spawn('python3', ['-m', 'http.server', '8000'], {
    stdio: 'inherit'
});

const buildProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
});

console.log('🚀 Development server starting on http://localhost:8000');
console.log('📦 Build watching for changes...');

const cleanup = () => {
    console.log('\n🛑 Shutting down...');
    
    if (buildProcess && !buildProcess.killed) {
        buildProcess.kill('SIGTERM');
    }
    
    if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGTERM');
    }
    
    process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

serverProcess.on('error', (err) => {
    console.error('❌ Server error:', err);
    cleanup();
});

buildProcess.on('error', (err) => {
    console.error('❌ Build error:', err);
    cleanup();
});