import { EventEmitter } from 'events';
export declare enum ErrorType {
    AUTHENTICATION = "authentication",
    RATE_LIMIT = "rate_limit",
    NETWORK = "network",
    AUDIO_FORMAT = "audio_format",
    SERVICE_UNAVAILABLE = "service_unavailable",
    QUOTA_EXCEEDED = "quota_exceeded",
    TIMEOUT = "timeout",
    UNKNOWN = "unknown"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface ErrorInfo {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    originalError: Error;
    timestamp: number;
    retryable: boolean;
    suggestedAction: string;
    retryDelay?: number;
}
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors: ErrorType[];
}
export declare class SpeechToTextErrorHandler extends EventEmitter {
    private retryConfig;
    private errorHistory;
    private readonly maxHistorySize;
    constructor(retryConfig?: Partial<RetryConfig>);
    analyzeError(error: Error): ErrorInfo;
    private categorizeError;
    private extractRetryDelay;
    shouldRetry(errorInfo: ErrorInfo, currentRetryCount: number): boolean;
    calculateRetryDelay(errorInfo: ErrorInfo, retryCount: number): number;
    executeWithRetry<T>(operation: () => Promise<T>, context?: string): Promise<T>;
    getErrorStats(): {
        totalErrors: number;
        errorsByType: Record<ErrorType, number>;
        errorsBySeverity: Record<ErrorSeverity, number>;
        recentErrors: ErrorInfo[];
        mostCommonError: ErrorType | null;
    };
    clearErrorHistory(): void;
    updateRetryConfig(newConfig: Partial<RetryConfig>): void;
    getRetryConfig(): RetryConfig;
    createFallbackTranscription(audioSegment: any): {
        text: string;
        confidence: number;
        isFallback: true;
    };
    dispose(): void;
}
//# sourceMappingURL=SpeechToTextErrorHandler.d.ts.map