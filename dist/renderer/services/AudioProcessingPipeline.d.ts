import { EventEmitter } from 'events';
import { AudioSegment } from '../interfaces/AudioCaptureService';
export interface ProcessingStage {
    name: string;
    process(segment: AudioSegment): Promise<AudioSegment>;
}
export interface PipelineConfig {
    enableNoiseReduction: boolean;
    enableVolumeNormalization: boolean;
    enableHighPassFilter: boolean;
    highPassFrequency: number;
    volumeThreshold: number;
}
export declare class AudioProcessingPipeline extends EventEmitter {
    private stages;
    private config;
    private audioContext;
    constructor(config?: Partial<PipelineConfig>);
    private initializeStages;
    processSegment(segment: AudioSegment): Promise<AudioSegment>;
    updateConfig(newConfig: Partial<PipelineConfig>): void;
    getConfig(): PipelineConfig;
    dispose(): void;
}
//# sourceMappingURL=AudioProcessingPipeline.d.ts.map