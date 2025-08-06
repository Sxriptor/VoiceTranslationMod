import { AudioCaptureService } from '../services/AudioCaptureService';
import { VoiceActivityDetector } from '../services/VoiceActivityDetector';
import { AudioProcessingPipeline } from '../services/AudioProcessingPipeline';
export interface AudioLevelData {
    volume: number;
    peak: number;
    average: number;
}
export declare class AudioCaptureControls {
    private captureService;
    private voiceDetector;
    private processingPipeline;
    private startButton;
    private stopButton;
    private statusIndicator;
    private levelMeter;
    private levelBar;
    private voiceIndicator;
    private isRecording;
    private audioLevels;
    private animationFrame;
    constructor(captureService: AudioCaptureService, voiceDetector: VoiceActivityDetector, processingPipeline: AudioProcessingPipeline, containerId: string);
    private createUI;
    private setupEventListeners;
    private startRecording;
    private stopRecording;
    private updateRecordingState;
    private updateStatus;
    private updateVoiceStatus;
    private updateVoiceIndicator;
    private updateAudioLevels;
    private updateLevelDisplay;
    private startLevelMonitoring;
    private stopLevelMonitoring;
    private resetAudioLevels;
    private showErrorMessage;
    getRecordingState(): boolean;
    dispose(): void;
}
//# sourceMappingURL=AudioCaptureControls.d.ts.map