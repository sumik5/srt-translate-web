import { SRTFile } from './types';

export class UIManager {
    private fileListElement: HTMLElement;
    private progressInfo: HTMLElement;
    private progressFill: HTMLElement;
    private statusMessage: HTMLElement;
    private errorMessage: HTMLElement;
    private downloadAllBtn: HTMLButtonElement;

    constructor() {
        this.fileListElement = document.getElementById('fileList')!;
        this.progressInfo = document.getElementById('progressInfo')!;
        this.progressFill = document.getElementById('progressFill')!;
        this.statusMessage = document.getElementById('statusMessage')!;
        this.errorMessage = document.getElementById('errorMessage')!;
        this.downloadAllBtn = document.getElementById('downloadAllBtn') as HTMLButtonElement;
    }

    showError(message: string): void {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.add('show');
        setTimeout(() => {
            this.errorMessage.classList.remove('show');
        }, 5000);
    }

    hideError(): void {
        this.errorMessage.classList.remove('show');
    }

    showProgress(message: string, progress: number): void {
        this.progressInfo.style.display = 'block';
        this.statusMessage.textContent = message;
        this.progressFill.style.width = `${progress}%`;
    }

    hideProgress(): void {
        this.progressInfo.style.display = 'none';
        this.progressFill.style.width = '0%';
    }

    updateFileList(files: SRTFile[], onTranslate: (id: string) => void, onDownload: (id: string) => void, onRemove: (id: string) => void): void {
        if (files.length === 0) {
            this.fileListElement.innerHTML = '<div class="empty-state">SRTファイルをアップロードしてください</div>';
            this.downloadAllBtn.disabled = true;
            return;
        }

        const hasCompleted = files.some(f => f.status === 'completed');
        this.downloadAllBtn.disabled = !hasCompleted;

        this.fileListElement.innerHTML = files.map(file => `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-info">
                    <div class="file-icon ${file.status}">
                        ${this.getFileIcon(file.status)}
                    </div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-status">${this.getStatusText(file.status)}</div>
                    </div>
                </div>
                <div class="file-actions">
                    ${file.status === 'pending' ? `
                        <button class="btn btn-default btn-small" data-action="translate" data-id="${file.id}">
                            翻訳
                        </button>
                    ` : ''}
                    ${file.status === 'completed' ? `
                        <button class="btn btn-success btn-small" data-action="download" data-id="${file.id}">
                            ダウンロード
                        </button>
                    ` : ''}
                    <button class="btn btn-danger" data-action="remove" data-id="${file.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        this.fileListElement.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const action = target.dataset.action;
                const id = target.dataset.id!;
                
                switch (action) {
                    case 'translate':
                        onTranslate(id);
                        break;
                    case 'download':
                        onDownload(id);
                        break;
                    case 'remove':
                        onRemove(id);
                        break;
                }
            });
        });
    }

    private getFileIcon(status: string): string {
        switch (status) {
            case 'pending':
                return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
            case 'translating':
                return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"></path></svg>';
            case 'completed':
                return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
            case 'error':
                return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
            default:
                return '';
        }
    }

    private getStatusText(status: string): string {
        switch (status) {
            case 'pending':
                return '翻訳待機中';
            case 'translating':
                return '翻訳中...';
            case 'completed':
                return '翻訳完了';
            case 'error':
                return '翻訳エラー';
            default:
                return '';
        }
    }

    setTranslateButtonLoading(loading: boolean): void {
        const button = document.getElementById('translateBtn') as HTMLButtonElement;
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
}