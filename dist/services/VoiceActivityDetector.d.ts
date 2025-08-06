import { EventEmitter } from 'events';
import { AudioSegment } from '../interfaces/AudioCaptureService';
export interface VoiceActivityConfig {
    volumeThreshold: number;
    silenceThreshold: number;
    minSpeechDuration: number;
    minSilenceDuration: number;
    energyThreshold: number;
    zeroCrossingThreshold: number;
}
export interface VoiceActivity {
    isVoiceActive: boolean;
    confidence: number;
    volume: number;
    energy: number;
    zeroCrossingRate: number;
    timestamp: number;
}
export declare class VoiceActivityDetector extends EventEmitter {
    private config;
    private isVoiceActive;
    private speechStartTime;
    private silenceStartTime;
    private recentActivity;
    private readonly activityHistorySize;
    constructor(config?: Partial<VoiceActivityConfig>);
    analyzeSegment(segment: AudioSegment): VoiceActivity;
    private calculateVolume;
    private calculateEnergy;
    private calculateZeroCrossingRate;
    private detectVoiceActivity;
    private calculateConfidence;
    private updateActivityHistory;
    private processStateChange;
    getCurrentState(): {
        isVoiceActive: boolean;
        speechDuration: number;
        silenceDuration: number;
        averageConfidence: number;
    };
    updateConfig(newConfig: Partial<VoiceActivityConfig>): void;
    getConfig(): VoiceActivityConfig;
    reset(): void;
    dispose(): void;
}
//# sourceMappingURL=VoiceActivityDetector.d.ts.map