"use strict";
/**
 * IPC channel definitions for communication between main and renderer processes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.VOICE_CHANNELS = exports.PERFORMANCE_CHANNELS = exports.DEBUG_CHANNELS = exports.ERROR_CHANNELS = exports.SERVICE_CHANNELS = exports.TRANSLATION_TTS_CHANNELS = exports.SPEECH_CHANNELS = exports.PIPELINE_CHANNELS = exports.CONFIG_CHANNELS = exports.AUDIO_CHANNELS = void 0;
// Audio-related channels
exports.AUDIO_CHANNELS = {
    GET_DEVICES: 'audio:get-devices',
    GET_DEVICES_RESPONSE: 'audio:get-devices-response',
    START_CAPTURE: 'audio:start-capture',
    STOP_CAPTURE: 'audio:stop-capture',
    AUDIO_DATA: 'audio:data',
    AUDIO_LEVEL: 'audio:level',
    DEVICE_CHANGED: 'audio:device-changed',
    STREAM: 'audio:stream'
};
// Configuration channels
exports.CONFIG_CHANNELS = {
    GET_CONFIG: 'config:get',
    GET_CONFIG_RESPONSE: 'config:get-response',
    SET_CONFIG: 'config:set',
    CONFIG_UPDATED: 'config:updated',
    VALIDATE_API_KEY: 'config:validate-api-key',
    API_KEY_VALIDATION_RESPONSE: 'config:api-key-validation-response'
};
// Translation pipeline channels
exports.PIPELINE_CHANNELS = {
    START_TRANSLATION: 'pipeline:start',
    STOP_TRANSLATION: 'pipeline:stop',
    TEST_TRANSLATION: 'pipeline:test',
    GET_STATUS: 'pipeline:get-status',
    PROCESS_AUDIO: 'pipeline:process-audio',
    PROCESSING_UPDATE: 'pipeline:processing-update',
    PROCESSING_RESULT: 'pipeline:processing-result',
    PROCESSING_ERROR: 'pipeline:processing-error'
};
// Speech-to-text channels
exports.SPEECH_CHANNELS = {
    TRANSCRIBE: 'speech:transcribe',
    TRANSCRIBE_RESPONSE: 'speech:transcribe-response',
    TRANSCRIBE_PUSH_TO_TALK: 'speech:transcribe-push-to-talk'
};
// Translation-only and TTS-only channels
exports.TRANSLATION_TTS_CHANNELS = {
    TRANSLATE_ONLY: 'translation:translate',
    SYNTHESIZE_ONLY: 'tts:synthesize'
};
// Translation-only and TTS-only channels
// Service status channels
exports.SERVICE_CHANNELS = {
    GET_SERVICE_STATUS: 'service:get-status',
    SERVICE_STATUS_RESPONSE: 'service:status-response',
    SERVICE_STATUS_CHANGED: 'service:status-changed'
};
// Error handling channels
exports.ERROR_CHANNELS = {
    ERROR_OCCURRED: 'error:occurred',
    ACKNOWLEDGE_ERROR: 'error:acknowledge',
    RETRY_OPERATION: 'error:retry'
};
// Debug and logging channels
exports.DEBUG_CHANNELS = {
    LOG_MESSAGE: 'debug:log',
    GET_LOGS: 'debug:get-logs',
    LOGS_RESPONSE: 'debug:logs-response',
    CLEAR_LOGS: 'debug:clear-logs'
};
// Performance monitoring channels
exports.PERFORMANCE_CHANNELS = {
    GET_METRICS: 'performance:get-metrics',
    METRICS_RESPONSE: 'performance:metrics-response',
    METRICS_UPDATE: 'performance:metrics-update'
};
// Voice cloning channels
exports.VOICE_CHANNELS = {
    GET_VOICES: 'voice:get-voices',
    VOICES_RESPONSE: 'voice:voices-response',
    START_VOICE_CLONING: 'voice:start-cloning',
    VOICE_CLONING_STATUS: 'voice:cloning-status',
    VOICE_CLONING_COMPLETE: 'voice:cloning-complete'
};
// All channels combined for type safety
exports.IPC_CHANNELS = {
    ...exports.AUDIO_CHANNELS,
    ...exports.CONFIG_CHANNELS,
    ...exports.PIPELINE_CHANNELS,
    ...exports.SPEECH_CHANNELS,
    ...exports.TRANSLATION_TTS_CHANNELS,
    ...exports.SERVICE_CHANNELS,
    ...exports.ERROR_CHANNELS,
    ...exports.DEBUG_CHANNELS,
    ...exports.PERFORMANCE_CHANNELS,
    ...exports.VOICE_CHANNELS
};
//# sourceMappingURL=channels.js.map