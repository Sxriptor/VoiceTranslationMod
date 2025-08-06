import { EventEmitter } from 'events';
import { AudioSegment } from '../interfaces/AudioCaptureService';
import { TranscriptionResult } from '../interfaces/SpeechToTextService';
import { ErrorInfo } from './SpeechToTextErrorHandler';
export interface TranscriptionMetrics {
    segmentId: string;
    audioSize: number;
    audioDuration: number;
    processingTime: number;
    transcriptionLength: number;
    confidence: number;
    cost: number;
    timestamp: number;
    language?: string;
    model?: string;
}
export interface PerformanceStats {
    totalTranscriptions: number;
    successfulTranscriptions: number;
    failedTranscriptions: number;
    averageProcessingTime: number;
    averageConfidence: number;
    totalCost: number;
    averageAudioSize: number;
    averageAudioDuration: number;
    successRate: number;
    throughput: number;
}
export interface QualityMetrics {
    averageConfidence: number;
    lowConfidenceCount: number;
    emptyTranscriptionCount: number;
    languageDistribution: Record<string, number>;
    confidenceDistribution: {
        high: number;
        medium: number;
        low: number;
    };
}
export interface DebugLog {
    timestamp: number;
    level: 'debug' | 'info' | 'warn' | 'error';
    category: 'transcription' | 'audio' | 'api' | 'performance' | 'error';
    message: string;
    data?: any;
}
export declare class SpeechToTextMonitor extends EventEmitter {
    private metrics;
    private errors;
    private debugLogs;
    private readonly maxMetricsHistory;
    private readonly maxErrorHistory;
    private readonly maxLogHistory;
    private startTime;
    recordTranscriptionStart(segment: AudioSegment): void;
    recordTranscriptionSuccess(segment: AudioSegment, result: TranscriptionResult, processingTime: number, cost: number, model?: string): void;
    recordTranscriptionError(segment: AudioSegment, error: ErrorInfo, processingTime: number): void;
    recordAudioProcessing(segment: AudioSegment, processingStage: string, duration: number): void;
    recordApiCall(endpoint: string, duration: number, success: boolean, responseSize?: number): void;
    private addMetrics;
    private addError;
    private log;
    private checkTranscriptionQuality;
    getPerformanceStats(timeWindow?: number): PerformanceStats;
    getQualityMetrics(timeWindow?: number): QualityMetrics;
    getDebugLogs(level?: 'debug' | 'info' | 'warn' | 'error', category?: 'transcription' | 'audio' | 'api' | 'performance' | 'error', limit?: number): DebugLog[];
    exportMetrics(): {
        metrics: TranscriptionMetrics[];
        errors: ErrorInfo[];
        logs: DebugLog[];
        stats: PerformanceStats;
        quality: QualityMetrics;
    };
    clearHistory(): void;
    startRealTimeMonitoring(): void;
    dispose(): void;
}
//# sourceMappingURL=SpeechToTextMonitor.d.ts.map