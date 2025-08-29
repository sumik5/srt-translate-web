import { APIClient } from './api-client';
import { SRTProcessor } from './srt-processor';
import { UIManager } from './ui-manager';
import { SRTFile, TranslationConfig } from './types';

class SRTTranslatorApp {
    private apiClient: APIClient;
    private srtProcessor: SRTProcessor;
    private uiManager: UIManager;
    private files: SRTFile[] = [];
    private config: TranslationConfig;

    constructor() {
        this.config = {
            apiUrl: 'http://127.0.0.1:1234',
            modelName: '',
            targetLanguage: '日本語'
        };

        this.apiClient = new APIClient(this.config.apiUrl);
        this.srtProcessor = new SRTProcessor();
        this.uiManager = new UIManager();

        this.init();
    }

    private async init(): Promise<void> {
        this.setupEventListeners();
        await this.loadModels();
    }

    private setupEventListeners(): void {
        // File input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer?.files;
                if (files) {
                    this.handleDroppedFiles(files);
                }
            });
        }

        // API URL change
        const apiUrlInput = document.getElementById('apiUrl') as HTMLInputElement;
        apiUrlInput.addEventListener('change', async (e) => {
            const target = e.target as HTMLInputElement;
            this.config.apiUrl = target.value;
            this.apiClient.setApiUrl(this.config.apiUrl);
            await this.loadModels();
        });

        // Model selection
        const modelSelect = document.getElementById('modelName') as HTMLSelectElement;
        modelSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.config.modelName = target.value;
        });

        // Target language selection
        const targetLangSelect = document.getElementById('targetLang') as HTMLSelectElement;
        targetLangSelect.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.config.targetLanguage = target.value;
        });

        // Refresh models button
        const refreshButton = document.getElementById('refreshModels') as HTMLButtonElement;
        refreshButton.addEventListener('click', () => this.loadModels());

        // Translate button
        const translateBtn = document.getElementById('translateBtn') as HTMLButtonElement;
        translateBtn.addEventListener('click', () => this.translateAllFiles());

        // Download all button
        const downloadAllBtn = document.getElementById('downloadAllBtn') as HTMLButtonElement;
        downloadAllBtn.addEventListener('click', () => this.downloadAllFiles());
    }

    private async loadModels(): Promise<void> {
        const modelSelect = document.getElementById('modelName') as HTMLSelectElement;
        
        try {
            const response = await this.apiClient.getModels();
            
            modelSelect.innerHTML = '';
            
            if (response.data && response.data.length > 0) {
                response.data.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.id;
                    modelSelect.appendChild(option);
                });
                
                // Select first model by default
                if (!this.config.modelName && response.data.length > 0) {
                    this.config.modelName = response.data[0].id;
                    modelSelect.value = this.config.modelName;
                }
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'モデルが見つかりません';
                modelSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Failed to load models:', error);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '接続エラー';
            modelSelect.appendChild(option);
            this.uiManager.showError('LM Studioへの接続に失敗しました。APIサーバーが起動していることを確認してください。');
        }
    }

    private async handleFileUpload(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const uploadedFiles = Array.from(input.files || []);
        await this.processFiles(uploadedFiles);
    }

    private async handleDroppedFiles(fileList: FileList): Promise<void> {
        const files = Array.from(fileList);
        await this.processFiles(files);
    }

    private async processFiles(files: File[]): Promise<void> {
        const srtFiles = files.filter(file => file.name.endsWith('.srt'));

        if (srtFiles.length === 0) {
            this.uiManager.showError('SRTファイルをアップロードしてください。');
            return;
        }

        const newFiles: SRTFile[] = [];
        for (const file of srtFiles) {
            const content = await this.readFile(file);
            const fileObj: SRTFile = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                originalContent: content,
                translatedContent: '',
                status: 'pending'
            };
            this.files.push(fileObj);
            newFiles.push(fileObj);
        }

        // Show file list container when files are added
        const fileListContainer = document.getElementById('fileListContainer');
        if (fileListContainer && this.files.length > 0) {
            fileListContainer.style.display = 'block';
        }

        this.updateUI();

        // Automatically start translation for new files (sequential, not parallel)
        await this.translateNewFiles(newFiles);
    }

    private readFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    private async translateFile(fileId: string): Promise<void> {
        const file = this.files.find(f => f.id === fileId);
        if (!file) return;

        if (!this.config.modelName) {
            this.uiManager.showError('モデルを選択してください。');
            return;
        }

        const chunkSizeInput = document.getElementById('chunkSize') as HTMLInputElement;
        const chunkSize = parseInt(chunkSizeInput.value, 10) || 2000;

        file.status = 'translating';
        this.updateUI();

        try {
            const translatedContent = await this.srtProcessor.translateSRT(
                file.originalContent,
                (text) => this.apiClient.translate(text, this.config.modelName, this.config.targetLanguage),
                chunkSize
            );
            
            file.translatedContent = translatedContent;
            file.status = 'completed';
        } catch (error) {
            console.error('Translation error:', error);
            file.status = 'error';
            this.uiManager.showError(`${file.name}の翻訳中にエラーが発生しました。`);
        }

        this.updateUI();
    }

    private async translateNewFiles(newFiles: SRTFile[]): Promise<void> {
        if (!this.config.modelName) {
            this.uiManager.showError('モデルを選択してください。LM Studioでモデルが起動していることを確認してください。');
            return;
        }

        this.uiManager.setTranslateButtonLoading(true);
        
        let completed = 0;
        const total = newFiles.length;

        for (const file of newFiles) {
            this.uiManager.showProgress(`${file.name}を翻訳中...`, (completed / total) * 100);
            await this.translateFile(file.id);
            completed++;
        }

        this.uiManager.hideProgress();
        this.uiManager.setTranslateButtonLoading(false);
    }

    private async translateAllFiles(): Promise<void> {
        const pendingFiles = this.files.filter(f => f.status === 'pending');
        
        if (pendingFiles.length === 0) {
            this.uiManager.showError('翻訳するファイルがありません。');
            return;
        }

        if (!this.config.modelName) {
            this.uiManager.showError('モデルを選択してください。');
            return;
        }

        this.uiManager.setTranslateButtonLoading(true);
        
        let completed = 0;
        const total = pendingFiles.length;

        for (const file of pendingFiles) {
            this.uiManager.showProgress(`${file.name}を翻訳中...`, (completed / total) * 100);
            await this.translateFile(file.id);
            completed++;
        }

        this.uiManager.hideProgress();
        this.uiManager.setTranslateButtonLoading(false);
    }

    private downloadFile(fileId: string): void {
        const file = this.files.find(f => f.id === fileId);
        if (!file || !file.translatedContent) return;

        // Remove .srt extension if present (case-insensitive)
        let baseName = file.name;
        if (baseName.toLowerCase().endsWith('.srt')) {
            baseName = baseName.substring(0, baseName.length - 4);
        }
        
        // Use language code mapping for file naming
        const langCode = this.getLanguageCode(this.config.targetLanguage);
        const fileName = `${baseName}.${langCode}.srt`;

        const blob = new Blob([file.translatedContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    private getLanguageCode(language: string): string {
        const langMap: { [key: string]: string } = {
            '日本語': 'ja',
            '英語': 'en',
            '中国語': 'zh',
            '韓国語': 'ko',
            'スペイン語': 'es',
            'フランス語': 'fr',
            'ドイツ語': 'de'
        };
        return langMap[language] || 'translated';
    }

    private downloadAllFiles(): void {
        const completedFiles = this.files.filter(f => f.status === 'completed');
        
        if (completedFiles.length === 0) {
            this.uiManager.showError('翻訳済みのファイルがありません。');
            return;
        }

        completedFiles.forEach((file, index) => {
            setTimeout(() => this.downloadFile(file.id), index * 100);
        });
    }

    private removeFile(fileId: string): void {
        this.files = this.files.filter(f => f.id !== fileId);
        this.updateUI();
    }

    private updateUI(): void {
        this.uiManager.updateFileList(
            this.files,
            (id) => this.translateFile(id),
            (id) => this.downloadFile(id),
            (id) => this.removeFile(id)
        );
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SRTTranslatorApp());
} else {
    new SRTTranslatorApp();
}