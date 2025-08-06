import { AudioDevice } from '../interfaces/AudioCaptureService';
import { AppConfig, ApiKeys } from '../types/ConfigurationTypes';
import { ProcessingResult, AudioSegment } from '../types/AudioTypes';
import { ServiceStatus, PerformanceMetrics } from '../types/StateTypes';
import { ErrorInfo } from '../types/ErrorTypes';
import { Voice } from '../interfaces/TextToSpeechService';
/**
 * Base interface for all IPC messages
 */
export interface BaseIPCMessage {
    /** Unique message ID for request/response correlation */
    id: string;
    /** Timestamp when message was created */
    timestamp: number;
}
/**
 * IPC request message
 */
export interface IPCRequest<T = any> extends BaseIPCMessage {
    /** Request payload */
    payload: T;
}
/**
 * IPC response message
 */
export interface IPCResponse<T = any> extends BaseIPCMessage {
    /** Whether the request was successful */
    success: boolean;
    /** Response payload (if successful) */
    payload?: T;
    /** Error information (if failed) */
    error?: string;
}
export interface GetAudioDevicesRequest extends IPCRequest<void> {
}
export interface GetAudioDevicesResponse extends IPCResponse<AudioDevice[]> {
}
export interface StartAudioCaptureRequest extends IPCRequest<{
    deviceId: string;
}> {
}
export interface StopAudioCaptureRequest extends IPCRequest<void> {
}
export interface AudioDataMessage extends BaseIPCMessage {
    audioData: ArrayBuffer;
    level: number;
    timestamp: number;
}
export interface AudioLevelMessage extends BaseIPCMessage {
    level: number;
}
export interface DeviceChangedMessage extends BaseIPCMessage {
    devices: AudioDevice[];
}
export interface GetConfigRequest extends IPCRequest<void> {
}
export interface GetConfigResponse extends IPCResponse<AppConfig> {
}
export interface SetConfigRequest extends IPCRequest<Partial<AppConfig>> {
}
export interface ConfigUpdatedMessage extends BaseIPCMessage {
    config: AppConfig;
}
export interface ValidateApiKeyRequest extends IPCRequest<{
    service: keyof ApiKeys;
    apiKey: string;
}> {
}
export interface ValidateApiKeyResponse extends IPCResponse<{
    valid: boolean;
    error?: string;
}> {
}
export interface StartTranslationRequest extends IPCRequest<void> {
}
export interface StopTranslationRequest extends IPCRequest<void> {
}
export interface ProcessAudioRequest extends IPCRequest<{
    audioSegment: AudioSegment;
}> {
}
export interface ProcessingUpdateMessage extends BaseIPCMessage {
    segmentId: string;
    step: string;
    progress: number;
}
export interface ProcessingResultMessage extends BaseIPCMessage {
    result: ProcessingResult;
}
export interface ProcessingErrorMessage extends BaseIPCMessage {
    segmentId: string;
    error: ErrorInfo;
}
export interface GetServiceStatusRequest extends IPCRequest<void> {
}
export interface ServiceStatusResponse extends IPCResponse<ServiceStatus> {
}
export interface ServiceStatusChangedMessage extends BaseIPCMessage {
    serviceStatus: ServiceStatus;
}
export interface ErrorOccurredMessage extends BaseIPCMessage {
    error: ErrorInfo;
}
export interface AcknowledgeErrorRequest extends IPCRequest<{
    errorId: string;
}> {
}
export interface RetryOperationRequest extends IPCRequest<{
    operationId: string;
}> {
}
export interface LogMessage extends BaseIPCMessage {
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    component: string;
    data?: any;
}
export interface GetLogsRequest extends IPCRequest<{
    level?: string;
    component?: string;
    limit?: number;
}> {
}
export interface LogsResponse extends IPCResponse<LogMessage[]> {
}
export interface ClearLogsRequest extends IPCRequest<void> {
}
export interface GetMetricsRequest extends IPCRequest<void> {
}
export interface MetricsResponse extends IPCResponse<PerformanceMetrics> {
}
export interface MetricsUpdateMessage extends BaseIPCMessage {
    metrics: PerformanceMetrics;
}
export interface GetVoicesRequest extends IPCRequest<void> {
}
export interface VoicesResponse extends IPCResponse<Voice[]> {
}
export interface StartVoiceCloningRequest extends IPCRequest<{
    voiceName: string;
    audioSamples: ArrayBuffer[];
}> {
}
export interface VoiceCloningStatusMessage extends BaseIPCMessage {
    voiceId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
}
export interface VoiceCloningCompleteMessage extends BaseIPCMessage {
    voiceId: string;
    voice: Voice;
}
export type IPCRequestMessage = GetAudioDevicesRequest | StartAudioCaptureRequest | StopAudioCaptureRequest | GetConfigRequest | SetConfigRequest | ValidateApiKeyRequest | StartTranslationRequest | StopTranslationRequest | ProcessAudioRequest | GetServiceStatusRequest | AcknowledgeErrorRequest | RetryOperationRequest | GetLogsRequest | ClearLogsRequest | GetMetricsRequest | GetVoicesRequest | StartVoiceCloningRequest;
export type IPCResponseMessage = GetAudioDevicesResponse | GetConfigResponse | ValidateApiKeyResponse | ServiceStatusResponse | LogsResponse | MetricsResponse | VoicesResponse;
export type IPCEventMessage = AudioDataMessage | AudioLevelMessage | DeviceChangedMessage | ConfigUpdatedMessage | ProcessingUpdateMessage | ProcessingResultMessage | ProcessingErrorMessage | ServiceStatusChangedMessage | ErrorOccurredMessage | LogMessage | MetricsUpdateMessage | VoiceCloningStatusMessage | VoiceCloningCompleteMessage;
//# sourceMappingURL=messages.d.ts.map