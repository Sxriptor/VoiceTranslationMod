import { EventEmitter } from 'events';
import { AudioCaptureService as IAudioCaptureService } from '../interfaces/AudioCaptureService';
export interface AudioCaptureConfig {
    sampleRate: number;
    channelCount: number;
    bufferSize: number;
    deviceId?: string;
}
export declare class AudioCaptureService extends EventEmitter implements IAudioCaptureService {
    private audioContext;
    private mediaStream;
    private sourceNode;
    private processorNode;
    private isCapturing;
    private config;
    private audioBuffer;
    private segmentCounter;
    constructor(config?: Partial<AudioCaptureConfig>);
    startCapture(deviceId?: string): Promise<void>;
    stopCapture(): Promise<void>;
    isActive(): boolean;
    getAudioContext(): AudioContext | null;
    private processAudioData;
    private createAudioSegment;
    private cleanup;
    convertToWav(audioData: Float32Array, sampleRate: number): ArrayBuffer;
    getConfig(): AudioCaptureConfig;
    updateConfig(newConfig: Partial<AudioCaptureConfig>): void;
    dispose(): void;
}
//# sourceMappingURL=AudioCaptureService.d.ts.map