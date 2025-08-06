/**
 * Base error class for application errors
 */
export class AppError extends Error {
    constructor(message, code, context) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = Date.now();
        this.context = context;
        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
/**
 * Audio-related errors
 */
export class AudioError extends AppError {
    constructor(message, code, context) {
        super(message, code, context);
    }
}
/**
 * API-related errors
 */
export class ApiError extends AppError {
    constructor(message, code, statusCode, context, rateLimit) {
        super(message, code, context);
        this.statusCode = statusCode;
        this.rateLimit = rateLimit;
    }
}
/**
 * Configuration-related errors
 */
export class ConfigError extends AppError {
    constructor(message, code, context) {
        super(message, code, context);
    }
}
/**
 * Device-related errors
 */
export class DeviceError extends AppError {
    constructor(message, code, deviceId, context) {
        super(message, code, context);
        this.deviceId = deviceId;
    }
}
/**
 * Network-related errors
 */
export class NetworkError extends AppError {
    constructor(message, code, isTemporary = true, context) {
        super(message, code, context);
        this.isTemporary = isTemporary;
    }
}
/**
 * Error severity levels
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
/**
 * Error categories for handling and reporting
 */
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AUDIO"] = "audio";
    ErrorCategory["API"] = "api";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["DEVICE"] = "device";
    ErrorCategory["CONFIGURATION"] = "configuration";
    ErrorCategory["PROCESSING"] = "processing";
    ErrorCategory["UI"] = "ui";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (ErrorCategory = {}));
/**
 * Common error codes used throughout the application
 */
export const ErrorCodes = {
    // Audio errors
    MICROPHONE_ACCESS_DENIED: 'MICROPHONE_ACCESS_DENIED',
    MICROPHONE_NOT_FOUND: 'MICROPHONE_NOT_FOUND',
    AUDIO_CAPTURE_FAILED: 'AUDIO_CAPTURE_FAILED',
    VIRTUAL_MIC_UNAVAILABLE: 'VIRTUAL_MIC_UNAVAILABLE',
    // API errors
    API_KEY_INVALID: 'API_KEY_INVALID',
    API_RATE_LIMITED: 'API_RATE_LIMITED',
    API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',
    API_SERVICE_UNAVAILABLE: 'API_SERVICE_UNAVAILABLE',
    // Network errors
    NETWORK_OFFLINE: 'NETWORK_OFFLINE',
    NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
    NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
    // Processing errors
    TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
    TRANSLATION_FAILED: 'TRANSLATION_FAILED',
    TTS_SYNTHESIS_FAILED: 'TTS_SYNTHESIS_FAILED',
    VOICE_CLONING_FAILED: 'VOICE_CLONING_FAILED',
    // Configuration errors
    CONFIG_INVALID: 'CONFIG_INVALID',
    CONFIG_MISSING: 'CONFIG_MISSING',
    CONFIG_SAVE_FAILED: 'CONFIG_SAVE_FAILED',
    // General errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    INITIALIZATION_FAILED: 'INITIALIZATION_FAILED'
};
//# sourceMappingURL=ErrorTypes.js.map