import { EventEmitter } from 'events';
export declare enum PermissionStatus {
    GRANTED = "granted",
    DENIED = "denied",
    PROMPT = "prompt",
    UNKNOWN = "unknown"
}
export interface PermissionResult {
    status: PermissionStatus;
    message?: string;
}
export declare class AudioPermissionService extends EventEmitter {
    private currentStatus;
    requestMicrophonePermission(): Promise<PermissionResult>;
    checkPermissionStatus(): Promise<PermissionStatus>;
    getCurrentStatus(): PermissionStatus;
    private getPermissionErrorMessage;
    getUserFriendlyPermissionMessage(): string;
}
//# sourceMappingURL=AudioPermissionService.d.ts.map