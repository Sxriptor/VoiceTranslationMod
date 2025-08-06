import { EventEmitter } from 'events';
import { SpeechToTextService as ISpeechToTextService, TranscriptionResult } from '../interfaces/SpeechToTextService';
import { AudioSegment } from '../interfaces/AudioCaptureService';
import { WhisperApiClient } from './WhisperApiClient';
export interface SpeechToTextConfig {
    language?: string;
    model?: string;
    temperature?: number;
    enableOptimization: boolean;
    enableCaching: boolean;
    maxCacheSize: number;
    confidenceThreshold: number;
}
export interface ProcessingMetrics {
    segmentId: string;
    processingTime: number;
    audioSize: number;
    transcriptionLength: number;
    confidence: number;
    cost: number;
}
export declare class SpeechToTextService extends EventEmitter implements ISpeechToTextService {
    private whisperClient;
    private config;
    private transcriptionCache;
    private processingQueue;
    private isProcessing;
    private metrics;
    constructor(whisperClient: WhisperApiClient, config?: Partial<SpeechToTextConfig>);
    transcribe(segment: AudioSegment): Promise<TranscriptionResult>;
    private processWhisperResponse;
    private getCachedTranscription;
    private cacheTranscription;
    private createAudioHash;
    private recordMetrics;
    queueTranscription(segment: AudioSegment): Promise<void>;
    private processQueue;
    getQueueLength(): number;
    clearQueue(): void;
    updateConfig(newConfig: Partial<SpeechToTextConfig>): void;
    getConfig(): SpeechToTextConfig;
    clearCache(): void;
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    };
    getMetrics(): {
        totalTranscriptions: number;
        averageProcessingTime: number;
        averageConfidence: number;
        totalCost: number;
        averageAudioSize: number;
    };
    validateService(): Promise<boolean>;
    setLanguage(language: string): void;
    getSupportedLanguages(): string[];
    isAvailable(): boolean;
    dispose(): void;
}
//# sourceMappingURL=SpeechToTextService.d.ts.map