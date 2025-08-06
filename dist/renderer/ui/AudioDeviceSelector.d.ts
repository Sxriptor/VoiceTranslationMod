import { AudioDeviceService, AudioDeviceInfo } from '../services/AudioDeviceService';
import { ConfigurationManager } from '../services/ConfigurationManager';
export declare class AudioDeviceSelector {
    private deviceService;
    private configManager;
    private selectElement;
    private refreshButton;
    private statusIndicator;
    constructor(deviceService: AudioDeviceService, configManager: ConfigurationManager, containerId: string);
    private createUI;
    private setupEventListeners;
    private loadSavedDevice;
    private refreshDevices;
    private updateDeviceList;
    private selectDevice;
    private selectDefaultDevice;
    private testSelectedDevice;
    private handleDeviceDisconnection;
    private updateStatus;
    private showNotification;
    private dispatchEvent;
    getSelectedDevice(): AudioDeviceInfo | null;
    startMonitoring(): void;
    stopMonitoring(): void;
    dispose(): void;
}
//# sourceMappingURL=AudioDeviceSelector.d.ts.map