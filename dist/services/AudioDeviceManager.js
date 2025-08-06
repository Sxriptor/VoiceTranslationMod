"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioDeviceManager = void 0;
const events_1 = require("events");
class AudioDeviceManager extends events_1.EventEmitter {
    constructor(deviceService, captureService, configManager) {
        super();
        this.currentDevice = null;
        this.fallbackDevices = [];
        this.isMonitoring = false;
        this.deviceService = deviceService;
        this.captureService = captureService;
        this.configManager = configManager;
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Device service events
        this.deviceService.on('devicesRemoved', (removedDevices) => {
            this.handleDevicesRemoved(removedDevices);
        });
        this.deviceService.on('devicesAdded', (addedDevices) => {
            this.handleDevicesAdded(addedDevices);
        });
        this.deviceService.on('deviceListChanged', (event) => {
            this.updateFallbackDevices();
        });
        // Capture service events
        this.captureService.on('captureStarted', () => {
            this.startDeviceMonitoring();
        });
        this.captureService.on('captureStopped', () => {
            this.stopDeviceMonitoring();
        });
    }
    async switchDevice(deviceId, restartCapture = true) {
        const previousDevice = this.currentDevice;
        const newDevice = this.deviceService.getDeviceById(deviceId);
        if (!newDevice) {
            return {
                success: false,
                previousDevice: previousDevice || undefined,
                error: `Device with ID '${deviceId}' not found`
            };
        }
        try {
            // Test the new device first
            const isDeviceWorking = await this.deviceService.testDevice(deviceId);
            if (!isDeviceWorking) {
                return {
                    success: false,
                    previousDevice: previousDevice || undefined,
                    newDevice,
                    error: 'Device test failed - device may be in use or not working'
                };
            }
            // If capture is active, restart with new device
            const wasCapturing = this.captureService.isActive();
            if (wasCapturing && restartCapture) {
                await this.captureService.stopCapture();
            }
            // Update current device
            this.currentDevice = newDevice;
            // Save device selection
            await this.saveDeviceSelection(deviceId);
            // Restart capture with new device if it was active
            if (wasCapturing && restartCapture) {
                await this.captureService.startCapture(deviceId);
            }
            this.emit('deviceSwitched', {
                previousDevice: previousDevice || undefined,
                newDevice,
                success: true
            });
            return {
                success: true,
                previousDevice: previousDevice || undefined,
                newDevice
            };
        }
        catch (error) {
            // Try to restore previous device if switch failed
            if (previousDevice && restartCapture) {
                try {
                    await this.captureService.startCapture(previousDevice.deviceId);
                }
                catch (restoreError) {
                    console.error('Failed to restore previous device:', restoreError);
                }
            }
            return {
                success: false,
                previousDevice: previousDevice || undefined,
                newDevice,
                error: `Device switch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async handleDevicesRemoved(removedDevices) {
        if (!this.currentDevice)
            return;
        // Check if current device was removed
        const currentDeviceRemoved = removedDevices.some(device => device.deviceId === this.currentDevice?.deviceId);
        if (currentDeviceRemoved) {
            this.emit('currentDeviceDisconnected', this.currentDevice);
            await this.handleCurrentDeviceDisconnection();
        }
    }
    async handleDevicesAdded(addedDevices) {
        // Update fallback devices
        this.updateFallbackDevices();
        // If we don't have a current device, try to select one of the new devices
        if (!this.currentDevice && addedDevices.length > 0) {
            const defaultDevice = addedDevices.find(d => d.isDefault) || addedDevices[0];
            await this.switchDevice(defaultDevice.deviceId, false);
        }
        this.emit('devicesAdded', addedDevices);
    }
    async handleCurrentDeviceDisconnection() {
        const wasCapturing = this.captureService.isActive();
        if (wasCapturing) {
            // Stop current capture
            await this.captureService.stopCapture();
        }
        // Try fallback devices
        const fallbackResult = await this.tryFallbackDevices();
        if (fallbackResult.success && wasCapturing) {
            // Restart capture with fallback device
            try {
                await this.captureService.startCapture(fallbackResult.newDevice?.deviceId);
                this.emit('deviceFallbackSuccess', fallbackResult);
            }
            catch (error) {
                this.emit('deviceFallbackFailed', {
                    error: `Failed to restart capture with fallback device: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }
        else if (!fallbackResult.success) {
            this.emit('noFallbackDeviceAvailable', {
                error: 'No working fallback devices available'
            });
        }
    }
    async tryFallbackDevices() {
        this.updateFallbackDevices();
        for (const device of this.fallbackDevices) {
            try {
                const result = await this.switchDevice(device.deviceId, false);
                if (result.success) {
                    return result;
                }
            }
            catch (error) {
                console.warn(`Fallback device ${device.label} failed:`, error);
                continue;
            }
        }
        return {
            success: false,
            error: 'No working fallback devices found'
        };
    }
    updateFallbackDevices() {
        const allDevices = this.deviceService.getAvailableDevices();
        // Exclude current device from fallbacks
        this.fallbackDevices = allDevices.filter(device => device.deviceId !== this.currentDevice?.deviceId);
        // Sort by preference: default devices first, then by label
        this.fallbackDevices.sort((a, b) => {
            if (a.isDefault && !b.isDefault)
                return -1;
            if (!a.isDefault && b.isDefault)
                return 1;
            return a.label.localeCompare(b.label);
        });
    }
    async saveDeviceSelection(deviceId) {
        try {
            const config = await this.configManager.getConfiguration();
            config.selectedMicrophone = deviceId;
            await this.configManager.saveConfiguration(config);
        }
        catch (error) {
            console.error('Failed to save device selection:', error);
        }
    }
    startDeviceMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.deviceService.startDeviceMonitoring();
    }
    stopDeviceMonitoring() {
        if (!this.isMonitoring)
            return;
        this.isMonitoring = false;
        this.deviceService.stopDeviceMonitoring();
    }
    async initializeWithSavedDevice() {
        try {
            const config = await this.configManager.getConfiguration();
            const savedDeviceId = config.selectedMicrophone;
            // Refresh device list
            await this.deviceService.refreshDevices();
            if (savedDeviceId) {
                const savedDevice = this.deviceService.getDeviceById(savedDeviceId);
                if (savedDevice) {
                    const result = await this.switchDevice(savedDeviceId, false);
                    if (result.success) {
                        return;
                    }
                }
            }
            // If no saved device or saved device failed, select default
            const defaultDevice = this.deviceService.getDefaultDevice();
            if (defaultDevice) {
                await this.switchDevice(defaultDevice.deviceId, false);
            }
        }
        catch (error) {
            console.error('Failed to initialize with saved device:', error);
            // Try to select any available device
            const devices = this.deviceService.getAvailableDevices();
            if (devices.length > 0) {
                await this.switchDevice(devices[0].deviceId, false);
            }
        }
    }
    getCurrentDevice() {
        return this.currentDevice;
    }
    getFallbackDevices() {
        return [...this.fallbackDevices];
    }
    async testCurrentDevice() {
        if (!this.currentDevice)
            return false;
        try {
            return await this.deviceService.testDevice(this.currentDevice.deviceId);
        }
        catch (error) {
            console.error('Current device test failed:', error);
            return false;
        }
    }
    dispose() {
        this.stopDeviceMonitoring();
        this.removeAllListeners();
    }
}
exports.AudioDeviceManager = AudioDeviceManager;
//# sourceMappingURL=AudioDeviceManager.js.map