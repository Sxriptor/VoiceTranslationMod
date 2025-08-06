/**
 * IPC channel definitions for communication between main and renderer processes
 */

// Audio-related channels
export const AUDIO_CHANNELS = {
  GET_DEVICES: 'audio:get-devices',
  GET_DEVICES_RESPONSE: 'audio:get-devices-response',
  START_CAPTURE: 'audio:start-capture',
  STOP_CAPTURE: 'audio:stop-capture',
  AUDIO_DATA: 'audio:data',
  AUDIO_LEVEL: 'audio:level',
  DEVICE_CHANGED: 'audio:device-changed'
} as const;

// Configuration channels
export const CONFIG_CHANNELS = {
  GET_CONFIG: 'config:get',
  GET_CONFIG_RESPONSE: 'config:get-response',
  SET_CONFIG: 'config:set',
  CONFIG_UPDATED: 'config:updated',
  VALIDATE_API_KEY: 'config:validate-api-key',
  API_KEY_VALIDATION_RESPONSE: 'config:api-key-validation-response'
} as const;

// Translation pipeline channels
export const PIPELINE_CHANNELS = {
  START_TRANSLATION: 'pipeline:start',
  STOP_TRANSLATION: 'pipeline:stop',
  PROCESS_AUDIO: 'pipeline:process-audio',
  PROCESSING_UPDATE: 'pipeline:processing-update',
  PROCESSING_RESULT: 'pipeline:processing-result',
  PROCESSING_ERROR: 'pipeline:processing-error'
} as const;

// Service status channels
export const SERVICE_CHANNELS = {
  GET_SERVICE_STATUS: 'service:get-status',
  SERVICE_STATUS_RESPONSE: 'service:status-response',
  SERVICE_STATUS_CHANGED: 'service:status-changed'
} as const;

// Error handling channels
export const ERROR_CHANNELS = {
  ERROR_OCCURRED: 'error:occurred',
  ACKNOWLEDGE_ERROR: 'error:acknowledge',
  RETRY_OPERATION: 'error:retry'
} as const;

// Debug and logging channels
export const DEBUG_CHANNELS = {
  LOG_MESSAGE: 'debug:log',
  GET_LOGS: 'debug:get-logs',
  LOGS_RESPONSE: 'debug:logs-response',
  CLEAR_LOGS: 'debug:clear-logs'
} as const;

// Performance monitoring channels
export const PERFORMANCE_CHANNELS = {
  GET_METRICS: 'performance:get-metrics',
  METRICS_RESPONSE: 'performance:metrics-response',
  METRICS_UPDATE: 'performance:metrics-update'
} as const;

// Voice cloning channels
export const VOICE_CHANNELS = {
  GET_VOICES: 'voice:get-voices',
  VOICES_RESPONSE: 'voice:voices-response',
  START_VOICE_CLONING: 'voice:start-cloning',
  VOICE_CLONING_STATUS: 'voice:cloning-status',
  VOICE_CLONING_COMPLETE: 'voice:cloning-complete'
} as const;

// All channels combined for type safety
export const IPC_CHANNELS = {
  ...AUDIO_CHANNELS,
  ...CONFIG_CHANNELS,
  ...PIPELINE_CHANNELS,
  ...SERVICE_CHANNELS,
  ...ERROR_CHANNELS,
  ...DEBUG_CHANNELS,
  ...PERFORMANCE_CHANNELS,
  ...VOICE_CHANNELS
} as const;

// Type for all channel names
export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];