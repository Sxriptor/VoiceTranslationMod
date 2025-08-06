"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechToTextErrorHandler = exports.ErrorSeverity = exports.ErrorType = void 0;
const events_1 = require("events");
var ErrorType;
(function (ErrorType) {
    ErrorType["AUTHENTICATION"] = "authentication";
    ErrorType["RATE_LIMIT"] = "rate_limit";
    ErrorType["NETWORK"] = "network";
    ErrorType["AUDIO_FORMAT"] = "audio_format";
    ErrorType["SERVICE_UNAVAILABLE"] = "service_unavailable";
    ErrorType["QUOTA_EXCEEDED"] = "quota_exceeded";
    ErrorType["TIMEOUT"] = "timeout";
    ErrorType["UNKNOWN"] = "unknown";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
class SpeechToTextErrorHandler extends events_1.EventEmitter {
    constructor(retryConfig = {}) {
        super();
        this.errorHistory = [];
        this.maxHistorySize = 100;
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2,
            retryableErrors: [
                ErrorType.NETWORK,
                ErrorType.RATE_LIMIT,
                ErrorType.SERVICE_UNAVAILABLE,
                ErrorType.TIMEOUT
            ],
            ...retryConfig
        };
    }
    analyzeError(error) {
        const errorInfo = this.categorizeError(error);
        // Add to history
        this.errorHistory.push(errorInfo);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
        // Emit error event
        this.emit('errorAnalyzed', errorInfo);
        return errorInfo;
    }
    categorizeError(error) {
        const message = error.message.toLowerCase();
        const timestamp = Date.now();
        // Authentication errors
        if (message.includes('401') || message.includes('unauthorized') ||
            message.includes('api key') || message.includes('403') ||
            message.includes('forbidden')) {
            return {
                type: ErrorType.AUTHENTICATION,
                severity: ErrorSeverity.CRITICAL,
                message: 'Authentication failed. Please check your API key.',
                originalError: error,
                timestamp,
                retryable: false,
                suggestedAction: 'Verify and update your OpenAI API key in settings.'
            };
        }
        // Rate limiting
        if (message.includes('429') || message.includes('rate limit') ||
            message.includes('too many requests')) {
            const retryDelay = this.extractRetryDelay(error.message) || 5000;
            return {
                type: ErrorType.RATE_LIMIT,
                severity: ErrorSeverity.MEDIUM,
                message: 'API rate limit exceeded. Please wait before retrying.',
                originalError: error,
                timestamp,
                retryable: true,
                suggestedAction: 'Reduce transcription frequency or upgrade your API plan.',
                retryDelay
            };
        }
        // Network errors
        if (message.includes('network') || message.includes('fetch') ||
            message.includes('connection') || message.includes('timeout')) {
            return {
                type: ErrorType.NETWORK,
                severity: ErrorSeverity.MEDIUM,
                message: 'Network connection failed. Please check your internet connection.',
                originalError: error,
                timestamp,
                retryable: true,
                suggestedAction: 'Check your internet connection and try again.'
            };
        }
        // Timeout errors
        if (message.includes('timeout') || message.includes('aborted')) {
            return {
                type: ErrorType.TIMEOUT,
                severity: ErrorSeverity.MEDIUM,
                message: 'Request timed out. The audio file might be too large.',
                originalError: error,
                timestamp,
                retryable: true,
                suggestedAction: 'Try with shorter audio segments or check your connection speed.'
            };
        }
        // Audio format errors
        if (message.includes('audio') || message.includes('format') ||
            message.includes('encoding') || message.includes('invalid file')) {
            return {
                type: ErrorType.AUDIO_FORMAT,
                severity: ErrorSeverity.HIGH,
                message: 'Audio format is not supported or corrupted.',
                originalError: error,
                timestamp,
                retryable: false,
                suggestedAction: 'Check audio format and quality. Ensure audio is not corrupted.'
            };
        }
        // Service unavailable
        if (message.includes('500') || message.includes('502') ||
            message.includes('503') || message.includes('service unavailable')) {
            return {
                type: ErrorType.SERVICE_UNAVAILABLE,
                severity: ErrorSeverity.HIGH,
                message: 'Speech-to-text service is temporarily unavailable.',
                originalError: error,
                timestamp,
                retryable: true,
                suggestedAction: 'The service is experiencing issues. Please try again later.'
            };
        }
        // Quota exceeded
        if (message.includes('quota') || message.includes('billing') ||
            message.includes('insufficient funds')) {
            return {
                type: ErrorType.QUOTA_EXCEEDED,
                severity: ErrorSeverity.CRITICAL,
                message: 'API quota exceeded or billing issue.',
                originalError: error,
                timestamp,
                retryable: false,
                suggestedAction: 'Check your API usage and billing status. Consider upgrading your plan.'
            };
        }
        // Unknown error
        return {
            type: ErrorType.UNKNOWN,
            severity: ErrorSeverity.MEDIUM,
            message: `Unexpected error: ${error.message}`,
            originalError: error,
            timestamp,
            retryable: true,
            suggestedAction: 'Please try again. If the problem persists, contact support.'
        };
    }
    extractRetryDelay(errorMessage) {
        // Try to extract retry-after header value from error message
        const retryAfterMatch = errorMessage.match(/retry[- ]after[:\s]*(\d+)/i);
        if (retryAfterMatch) {
            return parseInt(retryAfterMatch[1]) * 1000; // Convert to milliseconds
        }
        return null;
    }
    shouldRetry(errorInfo, currentRetryCount) {
        // Check if error type is retryable
        if (!this.retryConfig.retryableErrors.includes(errorInfo.type)) {
            return false;
        }
        // Check if we haven't exceeded max retries
        if (currentRetryCount >= this.retryConfig.maxRetries) {
            return false;
        }
        // Don't retry critical errors
        if (errorInfo.severity === ErrorSeverity.CRITICAL) {
            return false;
        }
        return errorInfo.retryable;
    }
    calculateRetryDelay(errorInfo, retryCount) {
        // Use specific retry delay if provided
        if (errorInfo.retryDelay) {
            return errorInfo.retryDelay;
        }
        // Calculate exponential backoff
        const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        return Math.min(delay + jitter, this.retryConfig.maxDelay);
    }
    async executeWithRetry(operation, context = 'operation') {
        let lastError = null;
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                const result = await operation();
                // If we had previous errors but succeeded, emit recovery event
                if (lastError && attempt > 0) {
                    this.emit('errorRecovered', {
                        context,
                        lastError,
                        attempt,
                        totalAttempts: attempt + 1
                    });
                }
                return result;
            }
            catch (error) {
                const errorInfo = this.analyzeError(error);
                lastError = errorInfo;
                this.emit('retryAttempt', {
                    context,
                    errorInfo,
                    attempt,
                    maxAttempts: this.retryConfig.maxRetries + 1
                });
                // Check if we should retry
                if (!this.shouldRetry(errorInfo, attempt)) {
                    this.emit('retryAbandoned', { context, errorInfo, attempt });
                    throw error;
                }
                // Wait before retry (except on last attempt)
                if (attempt < this.retryConfig.maxRetries) {
                    const delay = this.calculateRetryDelay(errorInfo, attempt);
                    this.emit('retryDelaying', { context, errorInfo, delay, attempt });
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        // This should never be reached, but just in case
        throw lastError?.originalError || new Error('Maximum retries exceeded');
    }
    getErrorStats() {
        const errorsByType = {};
        const errorsBySeverity = {};
        // Initialize counters
        Object.values(ErrorType).forEach(type => errorsByType[type] = 0);
        Object.values(ErrorSeverity).forEach(severity => errorsBySeverity[severity] = 0);
        // Count errors
        this.errorHistory.forEach(error => {
            errorsByType[error.type]++;
            errorsBySeverity[error.severity]++;
        });
        // Find most common error
        const mostCommonError = Object.entries(errorsByType)
            .reduce((max, [type, count]) => count > max.count ? { type: type, count } : max, { type: null, count: 0 }).type;
        // Get recent errors (last 10)
        const recentErrors = this.errorHistory.slice(-10);
        return {
            totalErrors: this.errorHistory.length,
            errorsByType,
            errorsBySeverity,
            recentErrors,
            mostCommonError
        };
    }
    clearErrorHistory() {
        this.errorHistory = [];
        this.emit('errorHistoryCleared');
    }
    updateRetryConfig(newConfig) {
        this.retryConfig = { ...this.retryConfig, ...newConfig };
        this.emit('retryConfigUpdated', this.retryConfig);
    }
    getRetryConfig() {
        return { ...this.retryConfig };
    }
    // Fallback mechanisms
    createFallbackTranscription(audioSegment) {
        return {
            text: '[Audio transcription unavailable]',
            confidence: 0,
            isFallback: true
        };
    }
    dispose() {
        this.clearErrorHistory();
        this.removeAllListeners();
    }
}
exports.SpeechToTextErrorHandler = SpeechToTextErrorHandler;
//# sourceMappingURL=SpeechToTextErrorHandler.js.map