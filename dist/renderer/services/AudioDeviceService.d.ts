import { EventEmitter } from 'events';
export interface AudioDeviceInfo {
    deviceId: string;
    label: string;
    kind: MediaDeviceKind;
    groupId: string;
    isDefault: boolean;
}
export declare class AudioDeviceService extends EventEmitter {
    private devices;
    private isMonitoring;
    enumerateAudioDevices(): Promise<AudioDeviceInfo[]>;
    getAvailableDevices(): AudioDeviceInfo[];
    getDefaultDevice(): AudioDeviceInfo | null;
    getDeviceById(deviceId: string): AudioDeviceInfo | null;
    refreshDevices(): Promise<AudioDeviceInfo[]>;
    startDeviceMonitoring(): void;
    stopDeviceMonitoring(): void;
    private handleDeviceChange;
    testDevice(deviceId: string): Promise<boolean>;
    dispose(): void;
}
//# sourceMappingURL=AudioDeviceService.d.ts.map