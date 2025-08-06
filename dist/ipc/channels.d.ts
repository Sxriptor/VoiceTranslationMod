/**
 * IPC channel definitions for communication between main and renderer processes
 */
export declare const AUDIO_CHANNELS: {
    readonly GET_DEVICES: "audio:get-devices";
    readonly GET_DEVICES_RESPONSE: "audio:get-devices-response";
    readonly START_CAPTURE: "audio:start-capture";
    readonly STOP_CAPTURE: "audio:stop-capture";
    readonly AUDIO_DATA: "audio:data";
    readonly AUDIO_LEVEL: "audio:level";
    readonly DEVICE_CHANGED: "audio:device-changed";
};
export declare const CONFIG_CHANNELS: {
    readonly GET_CONFIG: "config:get";
    readonly GET_CONFIG_RESPONSE: "config:get-response";
    readonly SET_CONFIG: "config:set";
    readonly CONFIG_UPDATED: "config:updated";
    readonly VALIDATE_API_KEY: "config:validate-api-key";
    readonly API_KEY_VALIDATION_RESPONSE: "config:api-key-validation-response";
};
export declare const PIPELINE_CHANNELS: {
    readonly START_TRANSLATION: "pipeline:start";
    readonly STOP_TRANSLATION: "pipeline:stop";
    readonly PROCESS_AUDIO: "pipeline:process-audio";
    readonly PROCESSING_UPDATE: "pipeline:processing-update";
    readonly PROCESSING_RESULT: "pipeline:processing-result";
    readonly PROCESSING_ERROR: "pipeline:processing-error";
};
export declare const SERVICE_CHANNELS: {
    readonly GET_SERVICE_STATUS: "service:get-status";
    readonly SERVICE_STATUS_RESPONSE: "service:status-response";
    readonly SERVICE_STATUS_CHANGED: "service:status-changed";
};
export declare const ERROR_CHANNELS: {
    readonly ERROR_OCCURRED: "error:occurred";
    readonly ACKNOWLEDGE_ERROR: "error:acknowledge";
    readonly RETRY_OPERATION: "error:retry";
};
export declare const DEBUG_CHANNELS: {
    readonly LOG_MESSAGE: "debug:log";
    readonly GET_LOGS: "debug:get-logs";
    readonly LOGS_RESPONSE: "debug:logs-response";
    readonly CLEAR_LOGS: "debug:clear-logs";
};
export declare const PERFORMANCE_CHANNELS: {
    readonly GET_METRICS: "performance:get-metrics";
    readonly METRICS_RESPONSE: "performance:metrics-response";
    readonly METRICS_UPDATE: "performance:metrics-update";
};
export declare const VOICE_CHANNELS: {
    readonly GET_VOICES: "voice:get-voices";
    readonly VOICES_RESPONSE: "voice:voices-response";
    readonly START_VOICE_CLONING: "voice:start-cloning";
    readonly VOICE_CLONING_STATUS: "voice:cloning-status";
    readonly VOICE_CLONING_COMPLETE: "voice:cloning-complete";
};
export declare const IPC_CHANNELS: {
    readonly GET_VOICES: "voice:get-voices";
    readonly VOICES_RESPONSE: "voice:voices-response";
    readonly START_VOICE_CLONING: "voice:start-cloning";
    readonly VOICE_CLONING_STATUS: "voice:cloning-status";
    readonly VOICE_CLONING_COMPLETE: "voice:cloning-complete";
    readonly GET_METRICS: "performance:get-metrics";
    readonly METRICS_RESPONSE: "performance:metrics-response";
    readonly METRICS_UPDATE: "performance:metrics-update";
    readonly LOG_MESSAGE: "debug:log";
    readonly GET_LOGS: "debug:get-logs";
    readonly LOGS_RESPONSE: "debug:logs-response";
    readonly CLEAR_LOGS: "debug:clear-logs";
    readonly ERROR_OCCURRED: "error:occurred";
    readonly ACKNOWLEDGE_ERROR: "error:acknowledge";
    readonly RETRY_OPERATION: "error:retry";
    readonly GET_SERVICE_STATUS: "service:get-status";
    readonly SERVICE_STATUS_RESPONSE: "service:status-response";
    readonly SERVICE_STATUS_CHANGED: "service:status-changed";
    readonly START_TRANSLATION: "pipeline:start";
    readonly STOP_TRANSLATION: "pipeline:stop";
    readonly PROCESS_AUDIO: "pipeline:process-audio";
    readonly PROCESSING_UPDATE: "pipeline:processing-update";
    readonly PROCESSING_RESULT: "pipeline:processing-result";
    readonly PROCESSING_ERROR: "pipeline:processing-error";
    readonly GET_CONFIG: "config:get";
    readonly GET_CONFIG_RESPONSE: "config:get-response";
    readonly SET_CONFIG: "config:set";
    readonly CONFIG_UPDATED: "config:updated";
    readonly VALIDATE_API_KEY: "config:validate-api-key";
    readonly API_KEY_VALIDATION_RESPONSE: "config:api-key-validation-response";
    readonly GET_DEVICES: "audio:get-devices";
    readonly GET_DEVICES_RESPONSE: "audio:get-devices-response";
    readonly START_CAPTURE: "audio:start-capture";
    readonly STOP_CAPTURE: "audio:stop-capture";
    readonly AUDIO_DATA: "audio:data";
    readonly AUDIO_LEVEL: "audio:level";
    readonly DEVICE_CHANGED: "audio:device-changed";
};
export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
//# sourceMappingURL=channels.d.ts.map