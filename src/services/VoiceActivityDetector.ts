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

export class VoiceActivityDetector extends EventEmitter {
  private config: VoiceActivityConfig;
  private isVoiceActive = false;
  private speechStartTime = 0;
  private silenceStartTime = 0;
  private recentActivity: VoiceActivity[] = [];
  private readonly activityHistorySize = 10;

  constructor(config: Partial<VoiceActivityConfig> = {}) {
    super();
    this.config = {
      volumeThreshold: 0.01,      // Minimum volume to consider as voice
      silenceThreshold: 0.005,    // Maximum volume to consider as silence
      minSpeechDuration: 300,     // Minimum speech duration in ms
      minSilenceDuration: 500,    // Minimum silence duration in ms
      energyThreshold: 0.001,     // Energy threshold for voice detection
      zeroCrossingThreshold: 0.1, // Zero crossing rate threshold
      ...config
    };
  }

  analyzeSegment(segment: AudioSegment): VoiceActivity {
    const volume = this.calculateVolume(segment.data);
    const energy = this.calculateEnergy(segment.data);
    const zeroCrossingRate = this.calculateZeroCrossingRate(segment.data);
    
    // Determine if voice is active based on multiple features
    const isVoiceActive = this.detectVoiceActivity(volume, energy, zeroCrossingRate);
    
    // Calculate confidence based on how well the signal matches voice characteristics
    const confidence = this.calculateConfidence(volume, energy, zeroCrossingRate);

    const activity: VoiceActivity = {
      isVoiceActive,
      confidence,
      volume,
      energy,
      zeroCrossingRate,
      timestamp: segment.timestamp
    };

    // Update activity history
    this.updateActivityHistory(activity);
    
    // Process state changes
    this.processStateChange(activity, segment);

    return activity;
  }

  private calculateVolume(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += Math.abs(data[i]);
    }
    return sum / data.length;
  }

  private calculateEnergy(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return sum / data.length;
  }

  private calculateZeroCrossingRate(data: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < data.length; i++) {
      if ((data[i] >= 0) !== (data[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / data.length;
  }

  private detectVoiceActivity(volume: number, energy: number, zeroCrossingRate: number): boolean {
    // Primary check: volume above threshold
    const volumeCheck = volume > this.config.volumeThreshold;
    
    // Secondary check: energy above threshold
    const energyCheck = energy > this.config.energyThreshold;
    
    // Tertiary check: zero crossing rate indicates speech-like signal
    const zcrCheck = zeroCrossingRate > this.config.zeroCrossingThreshold && zeroCrossingRate < 0.5;
    
    // Voice is active if at least 2 out of 3 checks pass
    const activeChecks = [volumeCheck, energyCheck, zcrCheck].filter(Boolean).length;
    return activeChecks >= 2;
  }

  private calculateConfidence(volume: number, energy: number, zeroCrossingRate: number): number {
    let confidence = 0;
    
    // Volume confidence (0-0.4)
    if (volume > this.config.volumeThreshold) {
      confidence += Math.min(0.4, (volume / this.config.volumeThreshold) * 0.2);
    }
    
    // Energy confidence (0-0.3)
    if (energy > this.config.energyThreshold) {
      confidence += Math.min(0.3, (energy / this.config.energyThreshold) * 0.15);
    }
    
    // Zero crossing rate confidence (0-0.3)
    if (zeroCrossingRate > this.config.zeroCrossingThreshold && zeroCrossingRate < 0.5) {
      const optimal = 0.25; // Optimal ZCR for speech
      const deviation = Math.abs(zeroCrossingRate - optimal);
      confidence += Math.max(0, 0.3 - deviation * 2);
    }
    
    return Math.min(1, confidence);
  }

  private updateActivityHistory(activity: VoiceActivity): void {
    this.recentActivity.push(activity);
    if (this.recentActivity.length > this.activityHistorySize) {
      this.recentActivity.shift();
    }
  }

  private processStateChange(activity: VoiceActivity, segment: AudioSegment): void {
    const now = segment.timestamp;
    const wasVoiceActive = this.isVoiceActive;
    
    if (activity.isVoiceActive && !wasVoiceActive) {
      // Potential start of speech
      if (this.speechStartTime === 0) {
        this.speechStartTime = now;
      }
      
      // Check if we've had enough continuous speech
      if (now - this.speechStartTime >= this.config.minSpeechDuration) {
        this.isVoiceActive = true;
        this.silenceStartTime = 0;
        this.emit('voiceStarted', {
          timestamp: now,
          confidence: activity.confidence,
          segment
        });
      }
    } else if (!activity.isVoiceActive && wasVoiceActive) {
      // Potential end of speech
      if (this.silenceStartTime === 0) {
        this.silenceStartTime = now;
      }
      
      // Check if we've had enough continuous silence
      if (now - this.silenceStartTime >= this.config.minSilenceDuration) {
        this.isVoiceActive = false;
        this.speechStartTime = 0;
        this.emit('voiceEnded', {
          timestamp: now,
          confidence: activity.confidence,
          segment
        });
      }
    } else if (activity.isVoiceActive && wasVoiceActive) {
      // Continuing speech - reset silence timer
      this.silenceStartTime = 0;
    } else if (!activity.isVoiceActive && !wasVoiceActive) {
      // Continuing silence - reset speech timer
      this.speechStartTime = 0;
    }

    // Emit activity update
    this.emit('activityUpdate', activity);
  }

  getCurrentState(): {
    isVoiceActive: boolean;
    speechDuration: number;
    silenceDuration: number;
    averageConfidence: number;
  } {
    const now = Date.now();
    const speechDuration = this.speechStartTime > 0 ? now - this.speechStartTime : 0;
    const silenceDuration = this.silenceStartTime > 0 ? now - this.silenceStartTime : 0;
    
    const averageConfidence = this.recentActivity.length > 0
      ? this.recentActivity.reduce((sum, activity) => sum + activity.confidence, 0) / this.recentActivity.length
      : 0;

    return {
      isVoiceActive: this.isVoiceActive,
      speechDuration,
      silenceDuration,
      averageConfidence
    };
  }

  updateConfig(newConfig: Partial<VoiceActivityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): VoiceActivityConfig {
    return { ...this.config };
  }

  reset(): void {
    this.isVoiceActive = false;
    this.speechStartTime = 0;
    this.silenceStartTime = 0;
    this.recentActivity = [];
  }

  dispose(): void {
    this.reset();
    this.removeAllListeners();
  }
}