import { EventEmitter } from 'events';
import { AudioSegment } from '../interfaces/AudioCaptureService';
import { TranscriptionResult } from '../interfaces/SpeechToTextService';
import { SpeechToTextService } from './SpeechToTextService';
export interface QueueItem {
    id: string;
    segment: AudioSegment;
    priority: number;
    timestamp: number;
    retryCount: number;
    maxRetries: number;
}
export interface QueueConfig {
    maxConcurrentJobs: number;
    maxQueueSize: number;
    defaultPriority: number;
    retryDelay: number;
    maxRetries: number;
    rateLimitDelay: number;
}
export interface QueueStats {
    totalItems: number;
    processingItems: number;
    completedItems: number;
    failedItems: number;
    averageProcessingTime: number;
    queueLength: number;
}
export declare class TranscriptionQueue extends EventEmitter {
    private sttService;
    private config;
    private queue;
    private processing;
    private completed;
    private failed;
    private isRunning;
    private lastProcessTime;
    constructor(sttService: SpeechToTextService, config?: Partial<QueueConfig>);
    addSegment(segment: AudioSegment, priority?: number, maxRetries?: number): Promise<string>;
    private startProcessing;
    private processItem;
    private shouldRetry;
    getQueueStats(): QueueStats;
    getQueuedItems(): QueueItem[];
    getProcessingItems(): QueueItem[];
    getCompletedResults(): Array<{
        item: QueueItem;
        result: TranscriptionResult;
        processingTime: number;
    }>;
    getFailedItems(): Array<{
        item: QueueItem;
        error: Error;
        processingTime: number;
    }>;
    getItemStatus(itemId: string): 'queued' | 'processing' | 'completed' | 'failed' | 'not_found';
    getResult(itemId: string): TranscriptionResult | null;
    removeItem(itemId: string): boolean;
    clearQueue(): void;
    clearCompleted(): void;
    clearFailed(): void;
    clearAll(): void;
    pauseProcessing(): void;
    resumeProcessing(): void;
    updateConfig(newConfig: Partial<QueueConfig>): void;
    getConfig(): QueueConfig;
    dispose(): void;
}
//# sourceMappingURL=TranscriptionQueue.d.ts.map