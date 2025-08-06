"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualMicrophoneManager = void 0;
/**
 * Manages virtual microphone output for translated audio
 */
class VirtualMicrophoneManager {
    constructor() {
        this.audioContext = null;
        this.outputNode = null;
        this.isConnected = false;
        this.fallbackAudio = null;
        this.isStreamActive = false;
        this.audioFormat = {
            sampleRate: 44100,
            channels: 2,
            bitDepth: 16,
            encoding: 'pcm'
        };
        this.initializeAudioContext();
    }
    async initializeAudioContext() {
        try {
            this.audioContext = new AudioContext();
            // Create a gain node for output control
            this.outputNode = this.audioContext.createGain();
            this.outputNode.connect(this.audioContext.destination);
        }
        catch (error) {
            console.warn('Failed to initialize audio context:', error);
        }
    }
    async initialize() {
        await this.initializeAudioContext();
    }
    async sendAudio(audioBuffer) {
        if (!this.isConnected) {
            throw new Error('Virtual microphone not connected');
        }
        try {
            await this.playAudioBuffer(audioBuffer);
        }
        catch (error) {
            // Fallback to system audio output
            console.warn('Virtual microphone output failed, using fallback:', error);
            await this.playAudioFallback(audioBuffer);
        }
    }
    isAvailable() {
        return !!this.audioContext;
    }
    getDeviceInfo() {
        return {
            name: 'Virtual Microphone Output',
            id: 'virtual-mic-output',
            connected: this.isConnected,
            status: this.isConnected ? 'ready' : 'unavailable',
            supportedFormats: [this.audioFormat]
        };
    }
    async startStream() {
        this.isStreamActive = true;
        this.isConnected = true;
    }
    stopStream() {
        this.isStreamActive = false;
        this.isConnected = false;
    }
    isStreaming() {
        return this.isStreamActive;
    }
    setAudioFormat(format) {
        this.audioFormat = format;
    }
    getAudioFormat() {
        return this.audioFormat;
    }
    // Legacy methods for compatibility
    async getAvailableDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
            return audioOutputs.map(device => ({
                id: device.deviceId,
                name: device.label || 'Unknown Device',
                type: 'virtual',
                isConnected: true,
                isDefault: device.deviceId === 'default'
            }));
        }
        catch (error) {
            console.warn('Failed to enumerate audio devices:', error);
            return [{
                    id: 'default',
                    name: 'Default Audio Output',
                    type: 'virtual',
                    isConnected: true,
                    isDefault: true
                }];
        }
    }
    async connectToDevice(deviceId) {
        try {
            await this.startStream();
            return true;
        }
        catch (error) {
            console.error('Failed to connect to virtual device:', error);
            return false;
        }
    }
    async playAudio(request) {
        if (!this.isConnected) {
            throw new Error('No virtual microphone device connected');
        }
        try {
            if (request.audioBlob) {
                await this.playAudioBlob(request.audioBlob);
            }
            else if (request.audioBuffer) {
                await this.sendAudio(request.audioBuffer);
            }
            else {
                throw new Error('No audio data provided');
            }
        }
        catch (error) {
            console.warn('Virtual microphone output failed:', error);
            throw error;
        }
    }
    async playAudioBlob(audioBlob) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const url = URL.createObjectURL(audioBlob);
            audio.onended = () => {
                URL.revokeObjectURL(url);
                resolve();
            };
            audio.onerror = (error) => {
                URL.revokeObjectURL(url);
                reject(error);
            };
            audio.src = url;
            audio.play().catch(reject);
        });
    }
    async playAudioBuffer(audioBuffer) {
        if (!this.audioContext) {
            throw new Error('Audio context not available');
        }
        try {
            const audioData = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
            const source = this.audioContext.createBufferSource();
            source.buffer = audioData;
            if (this.outputNode) {
                source.connect(this.outputNode);
            }
            else {
                source.connect(this.audioContext.destination);
            }
            return new Promise((resolve, reject) => {
                source.onended = () => resolve();
                // AudioBufferSourceNode doesn't have onerror, handle errors in catch block
                source.start();
            });
        }
        catch (error) {
            throw new Error(`Failed to play audio buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async playAudioFallback(audioBuffer) {
        try {
            const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            // Use HTML5 audio element as fallback
            if (!this.fallbackAudio) {
                this.fallbackAudio = new Audio();
            }
            const url = URL.createObjectURL(audioBlob);
            this.fallbackAudio.src = url;
            return new Promise((resolve, reject) => {
                if (!this.fallbackAudio) {
                    reject(new Error('Fallback audio not available'));
                    return;
                }
                this.fallbackAudio.onended = () => {
                    URL.revokeObjectURL(url);
                    resolve();
                };
                this.fallbackAudio.onerror = (error) => {
                    URL.revokeObjectURL(url);
                    reject(error);
                };
                this.fallbackAudio.play().catch(reject);
            });
        }
        catch (error) {
            throw new Error(`Fallback audio playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async disconnect() {
        try {
            if (this.fallbackAudio) {
                this.fallbackAudio.pause();
                this.fallbackAudio.src = '';
            }
            if (this.audioContext && this.audioContext.state !== 'closed') {
                await this.audioContext.close();
            }
            this.isConnected = false;
        }
        catch (error) {
            console.warn('Error during disconnect:', error);
        }
    }
    isDeviceConnected() {
        return this.isConnected;
    }
    async getDeviceStatus(deviceId) {
        if (deviceId === 'default' && this.isConnected) {
            return 'connected';
        }
        return 'disconnected';
    }
    /**
     * Set output volume (0.0 to 1.0)
     */
    setVolume(volume) {
        if (this.outputNode && 'gain' in this.outputNode) {
            this.outputNode.gain.value = Math.max(0, Math.min(1, volume));
        }
        if (this.fallbackAudio) {
            this.fallbackAudio.volume = Math.max(0, Math.min(1, volume));
        }
    }
    /**
     * Test virtual microphone output
     */
    async testOutput() {
        try {
            // Create a simple test tone
            if (!this.audioContext) {
                await this.initializeAudioContext();
            }
            if (!this.audioContext) {
                return false;
            }
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            oscillator.frequency.value = 440; // A4 note
            gainNode.gain.value = 0.1; // Low volume
            oscillator.start();
            // Play for 200ms
            setTimeout(() => {
                oscillator.stop();
            }, 200);
            return true;
        }
        catch (error) {
            console.warn('Virtual microphone test failed:', error);
            return false;
        }
    }
}
exports.VirtualMicrophoneManager = VirtualMicrophoneManager;
//# sourceMappingURL=VirtualMicrophoneManager.js.map