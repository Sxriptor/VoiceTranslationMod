import { EventEmitter } from 'events';
import { AudioDeviceService, AudioDeviceInfo } from './AudioDeviceService';
import { AudioCaptureService } from './AudioCaptureService';
import { ConfigurationManager } from './ConfigurationManager';
export interface DeviceSwitchResult {
    success: boolean;
    previousDevice?: AudioDeviceInfo;
    newDevice?: AudioDeviceInfo;
    error?: string;
}
export declare class AudioDeviceManager extends EventEmitter {
    private deviceService;
    private captureService;
    private configManager;
    private currentDevice;
    private fallbackDevices;
    private isMonitoring;
    constructor(deviceService: AudioDeviceService, captureService: AudioCaptureService, configManager: ConfigurationManager);
    private setupEventListeners;
    switchDevice(deviceId: string, restartCapture?: boolean): Promise<DeviceSwitchResult>;
    private handleDevicesRemoved;
    private handleDevicesAdded;
    private handleCurrentDeviceDisconnection;
    private tryFallbackDevices;
    private updateFallbackDevices;
    private saveDeviceSelection;
    private startDeviceMonitoring;
    private stopDeviceMonitoring;
    initializeWithSavedDevice(): Promise<void>;
    getCurrentDevice(): AudioDeviceInfo | null;
    getFallbackDevices(): AudioDeviceInfo[];
    testCurrentDevice(): Promise<boolean>;
    dispose(): void;
}
//# sourceMappingURL=AudioDeviceManager.d.ts.map