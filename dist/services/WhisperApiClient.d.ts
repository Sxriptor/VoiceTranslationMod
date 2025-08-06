import { ApiKeyManager } from './ApiKeyManager';
export interface WhisperTranscriptionRequest {
    audio: Blob;
    model?: string;
    language?: string;
    prompt?: string;
    response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    temperature?: number;
}
export interface WhisperTranscriptionResponse {
    text: string;
    language?: string;
    duration?: number;
    segments?: WhisperSegment[];
}
export interface WhisperSegment {
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
}
export interface WhisperApiConfig {
    baseUrl: string;
    model: string;
    temperature: number;
    maxRetries: number;
    timeout: number;
}
export declare class WhisperApiClient {
    private apiKeyManager;
    private config;
    constructor(apiKeyManager: ApiKeyManager, config?: Partial<WhisperApiConfig>);
    transcribe(request: WhisperTranscriptionRequest): Promise<WhisperTranscriptionResponse>;
    validateApiKey(): Promise<boolean>;
    private createTestAudioBlob;
    updateConfig(newConfig: Partial<WhisperApiConfig>): void;
    getConfig(): WhisperApiConfig;
    getSupportedLanguages(): {
        code: string;
        name: string;
    }[];
}
//# sourceMappingURL=WhisperApiClient.d.ts.map