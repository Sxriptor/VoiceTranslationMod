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

export class AudioProcessingPipeline extends EventEmitter {
  private stages: ProcessingStage[] = [];
  private config: PipelineConfig;
  private audioContext: AudioContext | null = null;

  constructor(config: Partial<PipelineConfig> = {}) {
    super();
    this.config = {
      enableNoiseReduction: true,
      enableVolumeNormalization: true,
      enableHighPassFilter: true,
      highPassFrequency: 80, // Remove low-frequency noise
      volumeThreshold: 0.01,
      ...config
    };

    this.initializeStages();
  }

  private initializeStages(): void {
    this.stages = [];

    if (this.config.enableHighPassFilter) {
      this.stages.push(new HighPassFilterStage(this.config.highPassFrequency));
    }

    if (this.config.enableNoiseReduction) {
      this.stages.push(new NoiseReductionStage());
    }

    if (this.config.enableVolumeNormalization) {
      this.stages.push(new VolumeNormalizationStage());
    }
  }

  async processSegment(segment: AudioSegment): Promise<AudioSegment> {
    let processedSegment = segment;

    try {
      // Process through each stage
      for (const stage of this.stages) {
        this.emit('stageStarted', stage.name, processedSegment.id);
        processedSegment = await stage.process(processedSegment);
        this.emit('stageCompleted', stage.name, processedSegment.id);
      }

      this.emit('processingCompleted', processedSegment);
      return processedSegment;
    } catch (error) {
      this.emit('processingError', error, segment.id);
      throw error;
    }
  }

  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeStages();
  }

  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  dispose(): void {
    this.removeAllListeners();
  }
}

// High-pass filter to remove low-frequency noise
class HighPassFilterStage implements ProcessingStage {
  name = 'HighPassFilter';
  private cutoffFrequency: number;

  constructor(cutoffFrequency: number) {
    this.cutoffFrequency = cutoffFrequency;
  }

  async process(segment: AudioSegment): Promise<AudioSegment> {
    const filteredData = this.applyHighPassFilter(segment.data, segment.sampleRate);
    
    return {
      ...segment,
      data: filteredData
    };
  }

  private applyHighPassFilter(data: Float32Array, sampleRate: number): Float32Array {
    const filtered = new Float32Array(data.length);
    const rc = 1.0 / (2 * Math.PI * this.cutoffFrequency);
    const dt = 1.0 / sampleRate;
    const alpha = rc / (rc + dt);

    filtered[0] = data[0];
    for (let i = 1; i < data.length; i++) {
      filtered[i] = alpha * (filtered[i - 1] + data[i] - data[i - 1]);
    }

    return filtered;
  }
}

// Simple noise reduction using spectral subtraction
class NoiseReductionStage implements ProcessingStage {
  name = 'NoiseReduction';
  private noiseProfile: Float32Array | null = null;
  private isLearningNoise = true;
  private noiseSamples = 0;
  private readonly noiseLearningDuration = 8000; // Learn noise for first 0.5 seconds

  async process(segment: AudioSegment): Promise<AudioSegment> {
    // Simple noise reduction: if we're still learning noise, collect noise profile
    if (this.isLearningNoise && this.noiseSamples < this.noiseLearningDuration) {
      this.updateNoiseProfile(segment.data);
      this.noiseSamples += segment.data.length;
      
      if (this.noiseSamples >= this.noiseLearningDuration) {
        this.isLearningNoise = false;
      }
      
      return segment; // Return original during noise learning
    }

    // Apply noise reduction if we have a noise profile
    if (this.noiseProfile) {
      const reducedData = this.reduceNoise(segment.data);
      return {
        ...segment,
        data: reducedData
      };
    }

    return segment;
  }

  private updateNoiseProfile(data: Float32Array): void {
    if (!this.noiseProfile) {
      this.noiseProfile = new Float32Array(data.length);
    }

    // Simple averaging for noise profile
    for (let i = 0; i < Math.min(data.length, this.noiseProfile.length); i++) {
      this.noiseProfile[i] = (this.noiseProfile[i] + Math.abs(data[i])) / 2;
    }
  }

  private reduceNoise(data: Float32Array): Float32Array {
    if (!this.noiseProfile) return data;

    const reduced = new Float32Array(data.length);
    const reductionFactor = 0.5; // Reduce noise by 50%

    for (let i = 0; i < data.length; i++) {
      const noiseLevel = this.noiseProfile[i % this.noiseProfile.length];
      const signalLevel = Math.abs(data[i]);
      
      if (signalLevel > noiseLevel * 2) {
        // Signal is significantly above noise, keep it
        reduced[i] = data[i];
      } else {
        // Reduce noise
        reduced[i] = data[i] * reductionFactor;
      }
    }

    return reduced;
  }
}

// Volume normalization to ensure consistent levels
class VolumeNormalizationStage implements ProcessingStage {
  name = 'VolumeNormalization';
  private targetRMS = 0.1; // Target RMS level

  async process(segment: AudioSegment): Promise<AudioSegment> {
    const normalizedData = this.normalizeVolume(segment.data);
    
    return {
      ...segment,
      data: normalizedData
    };
  }

  private normalizeVolume(data: Float32Array): Float32Array {
    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);

    // Avoid division by zero
    if (rms < 0.001) {
      return data;
    }

    // Calculate gain
    const gain = this.targetRMS / rms;
    
    // Apply gain with limiting to prevent clipping
    const normalized = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      normalized[i] = Math.max(-1, Math.min(1, data[i] * gain));
    }

    return normalized;
  }
}