export interface SRTFile {
    id: string;
    name: string;
    originalContent: string;
    translatedContent: string;
    status: 'pending' | 'translating' | 'completed' | 'error';
}

export interface LMStudioModel {
    id: string;
    object: string;
    created: number;
    owned_by: string;
}

export interface LMStudioModelsResponse {
    data: LMStudioModel[];
}

export interface TranslationConfig {
    apiUrl: string;
    modelName: string;
    targetLanguage: string;
}

export interface SRTBlock {
    index: string;
    timestamp: string;
    subtitle: string;
}