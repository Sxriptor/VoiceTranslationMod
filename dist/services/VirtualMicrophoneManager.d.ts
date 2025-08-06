import { VirtualMicrophoneService, VirtualDeviceInfo, AudioFormat } from '../interfaces/VirtualMicrophoneService';
/**
 * Manages virtual microphone output for translated audio
 */
export declare class VirtualMicrophoneManager implements VirtualMicrophoneService {
    private audioContext;
    private outputNode;
    private isConnected;
    private fallbackAudio;
    private isStreamActive;
    private audioFormat;
    constructor();
    private initializeAudioContext;
    initialize(): Promise<void>;
    sendAudio(audioBuffer: ArrayBuffer): Promise<void>;
    isAvailable(): boolean;
    getDeviceInfo(): VirtualDeviceInfo;
    startStream(): Promise<void>;
    stopStream(): void;
    isStreaming(): boolean;
    setAudioFormat(format: AudioFormat): void;
    getAudioFormat(): AudioFormat;
    getAvailableDevices(): Promise<any[]>;
    connectToDevice(deviceId: string): Promise<boolean>;
    playAudio(request: {
        audioBlob?: Blob;
        audioBuffer?: ArrayBuffer;
    }): Promise<void>;
    private playAudioBlob;
    private playAudioBuffer;
    private playAudioFallback;
    disconnect(): Promise<void>;
    isDeviceConnected(): boolean;
    getDeviceStatus(deviceId: string): Promise<string>;
    /**
     * Set output volume (0.0 to 1.0)
     */
    setVolume(volume: number): void;
    /**
     * Test virtual microphone output
     */
    testOutput(): Promise<boolean>;
}
//# sourceMappingURL=VirtualMicrophoneManager.d.ts.map