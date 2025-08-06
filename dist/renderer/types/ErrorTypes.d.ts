/**
 * Base error class for application errors
 */
export declare abstract class AppError extends Error {
    /** Error code for programmatic handling */
    readonly code: string;
    /** Timestamp when error occurred */
    readonly timestamp: number;
    /** Additional error context */
    readonly context?: Record<string, any>;
    constructor(message: string, code: string, context?: Record<string, any>);
}
/**
 * Audio-related errors
 */
export declare class AudioError extends AppError {
    constructor(message: string, code: string, context?: Record<string, any>);
}
/**
 * API-related errors
 */
export declare class ApiError extends AppError {
    /** HTTP status code if applicable */
    readonly statusCode?: number;
    /** Rate limit information if applicable */
    readonly rateLimit?: RateLimitInfo;
    constructor(message: string, code: string, statusCode?: number, context?: Record<string, any>, rateLimit?: RateLimitInfo);
}
/**
 * Configuration-related errors
 */
export declare class ConfigError extends AppError {
    constructor(message: string, code: string, context?: Record<string, any>);
}
/**
 * Device-related errors
 */
export declare class DeviceError extends AppError {
    /** Device ID that caused the error */
    readonly deviceId?: string;
    constructor(message: string, code: string, deviceId?: string, context?: Record<string, any>);
}
/**
 * Network-related errors
 */
export declare class NetworkError extends AppError {
    /** Whether this is a temporary network issue */
    readonly isTemporary: boolean;
    constructor(message: string, code: string, isTemporary?: boolean, context?: Record<string, any>);
}
/**
 * Rate limit information
 */
export interface RateLimitInfo {
    /** Requests remaining in current window */
    remaining: number;
    /** Total requests allowed in window */
    limit: number;
    /** When the rate limit resets (timestamp) */
    resetTime: number;
    /** Rate limit window duration in seconds */
    windowDuration: number;
}
/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Error categories for handling and reporting
 */
export declare enum ErrorCategory {
    AUDIO = "audio",
    API = "api",
    NETWORK = "network",
    DEVICE = "device",
    CONFIGURATION = "configuration",
    PROCESSING = "processing",
    UI = "ui",
    UNKNOWN = "unknown"
}
/**
 * Structured error information for logging and reporting
 */
export interface ErrorInfo {
    /** Error instance */
    error: Error;
    /** Error category */
    category: ErrorCategory;
    /** Error severity */
    severity: ErrorSeverity;
    /** Whether error is recoverable */
    recoverable: boolean;
    /** Suggested recovery actions */
    recoveryActions?: string[];
    /** User-friendly error message */
    userMessage?: string;
    /** Additional context for debugging */
    debugContext?: Record<string, any>;
}
/**
 * Common error codes used throughout the application
 */
export declare const ErrorCodes: {
    readonly MICROPHONE_ACCESS_DENIED: "MICROPHONE_ACCESS_DENIED";
    readonly MICROPHONE_NOT_FOUND: "MICROPHONE_NOT_FOUND";
    readonly AUDIO_CAPTURE_FAILED: "AUDIO_CAPTURE_FAILED";
    readonly VIRTUAL_MIC_UNAVAILABLE: "VIRTUAL_MIC_UNAVAILABLE";
    readonly API_KEY_INVALID: "API_KEY_INVALID";
    readonly API_RATE_LIMITED: "API_RATE_LIMITED";
    readonly API_QUOTA_EXCEEDED: "API_QUOTA_EXCEEDED";
    readonly API_SERVICE_UNAVAILABLE: "API_SERVICE_UNAVAILABLE";
    readonly NETWORK_OFFLINE: "NETWORK_OFFLINE";
    readonly NETWORK_TIMEOUT: "NETWORK_TIMEOUT";
    readonly NETWORK_CONNECTION_FAILED: "NETWORK_CONNECTION_FAILED";
    readonly TRANSCRIPTION_FAILED: "TRANSCRIPTION_FAILED";
    readonly TRANSLATION_FAILED: "TRANSLATION_FAILED";
    readonly TTS_SYNTHESIS_FAILED: "TTS_SYNTHESIS_FAILED";
    readonly VOICE_CLONING_FAILED: "VOICE_CLONING_FAILED";
    readonly CONFIG_INVALID: "CONFIG_INVALID";
    readonly CONFIG_MISSING: "CONFIG_MISSING";
    readonly CONFIG_SAVE_FAILED: "CONFIG_SAVE_FAILED";
    readonly UNKNOWN_ERROR: "UNKNOWN_ERROR";
    readonly INITIALIZATION_FAILED: "INITIALIZATION_FAILED";
};
//# sourceMappingURL=ErrorTypes.d.ts.map