"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioDeviceService = void 0;
const events_1 = require("events");
class AudioDeviceService extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.devices = [];
        this.isMonitoring = false;
        this.handleDeviceChange = async () => {
            const previousDevices = [...this.devices];
            await this.enumerateAudioDevices();
            // Check for added devices
            const addedDevices = this.devices.filter(device => !previousDevices.some(prev => prev.deviceId === device.deviceId));
            // Check for removed devices
            const removedDevices = previousDevices.filter(device => !this.devices.some(current => current.deviceId === device.deviceId));
            if (addedDevices.length > 0) {
                this.emit('devicesAdded', addedDevices);
            }
            if (removedDevices.length > 0) {
                this.emit('devicesRemoved', removedDevices);
            }
            if (addedDevices.length > 0 || removedDevices.length > 0) {
                this.emit('deviceListChanged', {
                    added: addedDevices,
                    removed: removedDevices,
                    current: this.devices
                });
            }
        };
    }
    async enumerateAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices = devices
                .filter(device => device.kind === 'audioinput')
                .map(device => ({
                deviceId: device.deviceId,
                label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
                kind: device.kind,
                groupId: device.groupId,
                isDefault: device.deviceId === 'default'
            }));
            this.emit('devicesUpdated', this.devices);
            return this.devices;
        }
        catch (error) {
            console.error('Failed to enumerate audio devices:', error);
            this.emit('enumerationError', error);
            return [];
        }
    }
    getAvailableDevices() {
        return [...this.devices];
    }
    getDefaultDevice() {
        return this.devices.find(device => device.isDefault) || this.devices[0] || null;
    }
    getDeviceById(deviceId) {
        return this.devices.find(device => device.deviceId === deviceId) || null;
    }
    async refreshDevices() {
        return await this.enumerateAudioDevices();
    }
    startDeviceMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange);
    }
    stopDeviceMonitoring() {
        if (!this.isMonitoring)
            return;
        this.isMonitoring = false;
        navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange);
    }
    async testDevice(deviceId) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } }
            });
            // Test if we can get audio data
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            source.connect(analyser);
            // Clean up
            stream.getTracks().forEach(track => track.stop());
            await audioContext.close();
            return true;
        }
        catch (error) {
            console.error(`Failed to test device ${deviceId}:`, error);
            return false;
        }
    }
    dispose() {
        this.stopDeviceMonitoring();
        this.removeAllListeners();
    }
}
exports.AudioDeviceService = AudioDeviceService;
//# sourceMappingURL=AudioDeviceService.js.map