import { EventEmitter } from 'events';
import { SpeechToTextService as ISpeechToTextService, TranscriptionResult } from '../interfaces/SpeechToTextService';
import { AudioSegment } from '../interfaces/AudioCaptureService';
import { WhisperApiClient, WhisperTranscriptionResponse } from './WhisperApiClient';
import { AudioFormatConverter, ConversionResult } from './AudioFormatConverter';

export interface SpeechToTextConfig {
  language?: string;
  model?: string;
  temperature?: number;
  enableOptimization: boolean;
  enableCaching: boolean;
  maxCacheSize: number;
  confidenceThreshold: number;
}

export interface ProcessingMetrics {
  segmentId: string;
  processingTime: number;
  audioSize: number;
  transcriptionLength: number;
  confidence: number;
  cost: number;
}

export class SpeechToTextService extends EventEmitter implements ISpeechToTextService {
  private whisperClient: WhisperApiClient;
  private config: SpeechToTextConfig;
  private transcriptionCache = new Map<string, TranscriptionResult>();
  private processingQueue: AudioSegment[] = [];
  private isProcessing = false;
  private metrics: ProcessingMetrics[] = [];

  constructor(whisperClient: WhisperApiClient, config: Partial<SpeechToTextConfig> = {}) {
    super();
    this.whisperClient = whisperClient;
    this.config = {
      language: 'auto',
      model: 'whisper-1',
      temperature: 0,
      enableOptimization: true,
      enableCaching: true,
      maxCacheSize: 100,
      confidenceThreshold: 0.5,
      ...config
    };
  }

  async transcribe(segment: AudioSegment): Promise<TranscriptionResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cached = this.getCachedTranscription(segment);
        if (cached) {
          this.emit('transcriptionFromCache', { segment, result: cached });
          return cached;
        }
      }

      // Convert audio format for Whisper
      let conversionResult: ConversionResult;
      
      if (this.config.enableOptimization) {
        conversionResult = await AudioFormatConverter.optimizeForWhisper(
          segment.data,
          segment.sampleRate
        );
      } else {
        conversionResult = await AudioFormatConverter.convertForWhisper(
          segment.data,
          segment.sampleRate
        );
      }

      // Validate audio before sending to API
      const validation = AudioFormatConverter.validateAudioForWhisper(conversionResult.blob);
      if (!validation.valid) {
        throw new Error(`Audio validation failed: ${validation.issues.join(', ')}`);
      }

      // Prepare transcription request
      const request = {
        audio: conversionResult.blob,
        model: this.config.model,
        language: this.config.language === 'auto' ? undefined : this.config.language,
        response_format: 'verbose_json' as const,
        temperature: this.config.temperature
      };

      // Send to Whisper API
      this.emit('transcriptionStarted', { segment, audioSize: conversionResult.size });
      
      const whisperResponse = await this.whisperClient.transcribe(request);
      
      // Process response
      const result = this.processWhisperResponse(whisperResponse, segment);
      
      // Cache result if enabled
      if (this.config.enableCaching && result.confidence >= this.config.confidenceThreshold) {
        this.cacheTranscription(segment, result);
      }

      // Record metrics
      const processingTime = Date.now() - startTime;
      const cost = AudioFormatConverter.estimateTranscriptionCost(segment.data, segment.sampleRate);
      
      this.recordMetrics({
        segmentId: segment.id,
        processingTime,
        audioSize: conversionResult.size,
        transcriptionLength: result.text.length,
        confidence: result.confidence,
        cost
      });

      this.emit('transcriptionCompleted', { segment, result, processingTime });
      
      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.emit('transcriptionError', { segment, error, processingTime });
      throw error;
    }
  }

  private processWhisperResponse(
    response: WhisperTranscriptionResponse,
    segment: AudioSegment
  ): TranscriptionResult {
    // Calculate confidence from segments if available
    let confidence = 0.8; // Default confidence
    
    if (response.segments && response.segments.length > 0) {
      // Calculate average confidence from segment probabilities
      const avgLogProb = response.segments.reduce((sum, seg) => sum + seg.avg_logprob, 0) / response.segments.length;
      const avgNoSpeechProb = response.segments.reduce((sum, seg) => sum + seg.no_speech_prob, 0) / response.segments.length;
      
      // Convert log probabilities to confidence (rough approximation)
      confidence = Math.max(0, Math.min(1, Math.exp(avgLogProb) * (1 - avgNoSpeechProb)));
    }

    return {
      id: `transcription_${segment.id}`,
      text: response.text.trim(),
      confidence,
      language: response.language || 'unknown',
      duration: response.duration || segment.duration,
      timestamp: Date.now(),
      segments: response.segments?.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
        confidence: Math.exp(seg.avg_logprob) * (1 - seg.no_speech_prob)
      }))
    };
  }

  private getCachedTranscription(segment: AudioSegment): TranscriptionResult | null {
    // Create a simple hash of the audio data for caching
    const hash = this.createAudioHash(segment.data);
    return this.transcriptionCache.get(hash) || null;
  }

  private cacheTranscription(segment: AudioSegment, result: TranscriptionResult): void {
    const hash = this.createAudioHash(segment.data);
    
    // Manage cache size
    if (this.transcriptionCache.size >= this.config.maxCacheSize) {
      // Remove oldest entry (simple FIFO)
      const firstKey = this.transcriptionCache.keys().next().value;
      if (firstKey !== undefined) {
        this.transcriptionCache.delete(firstKey);
      }
    }
    
    this.transcriptionCache.set(hash, result);
  }

  private createAudioHash(audioData: Float32Array): string {
    // Create a simple hash based on audio characteristics
    let hash = 0;
    const step = Math.max(1, Math.floor(audioData.length / 100)); // Sample every N samples
    
    for (let i = 0; i < audioData.length; i += step) {
      const sample = Math.floor(audioData[i] * 1000);
      hash = ((hash << 5) - hash + sample) & 0xffffffff;
    }
    
    return hash.toString(36);
  }

  private recordMetrics(metrics: ProcessingMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics (last 100)
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
    
    this.emit('metricsUpdated', metrics);
  }

  // Queue-based processing for handling multiple segments
  async queueTranscription(segment: AudioSegment): Promise<void> {
    this.processingQueue.push(segment);
    this.emit('segmentQueued', { segment, queueLength: this.processingQueue.length });
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.emit('queueProcessingStarted', { queueLength: this.processingQueue.length });

    while (this.processingQueue.length > 0) {
      const segment = this.processingQueue.shift()!;
      
      try {
        const result = await this.transcribe(segment);
        this.emit('queuedTranscriptionCompleted', { segment, result });
      } catch (error) {
        this.emit('queuedTranscriptionError', { segment, error });
      }
    }

    this.isProcessing = false;
    this.emit('queueProcessingCompleted');
  }

  getQueueLength(): number {
    return this.processingQueue.length;
  }

  clearQueue(): void {
    this.processingQueue = [];
    this.emit('queueCleared');
  }

  // Configuration and management methods
  updateConfig(newConfig: Partial<SpeechToTextConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  getConfig(): SpeechToTextConfig {
    return { ...this.config };
  }

  clearCache(): void {
    this.transcriptionCache.clear();
    this.emit('cacheCleared');
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    // Calculate hit rate from recent metrics
    const recentMetrics = this.metrics.slice(-50);
    const cacheHits = recentMetrics.filter(m => m.processingTime < 100).length; // Assume cache hits are very fast
    const hitRate = recentMetrics.length > 0 ? cacheHits / recentMetrics.length : 0;

    return {
      size: this.transcriptionCache.size,
      maxSize: this.config.maxCacheSize,
      hitRate
    };
  }

  getMetrics(): {
    totalTranscriptions: number;
    averageProcessingTime: number;
    averageConfidence: number;
    totalCost: number;
    averageAudioSize: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalTranscriptions: 0,
        averageProcessingTime: 0,
        averageConfidence: 0,
        totalCost: 0,
        averageAudioSize: 0
      };
    }

    const total = this.metrics.length;
    const avgProcessingTime = this.metrics.reduce((sum, m) => sum + m.processingTime, 0) / total;
    const avgConfidence = this.metrics.reduce((sum, m) => sum + m.confidence, 0) / total;
    const totalCost = this.metrics.reduce((sum, m) => sum + m.cost, 0);
    const avgAudioSize = this.metrics.reduce((sum, m) => sum + m.audioSize, 0) / total;

    return {
      totalTranscriptions: total,
      averageProcessingTime: Math.round(avgProcessingTime),
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      totalCost: Math.round(totalCost * 1000) / 1000,
      averageAudioSize: Math.round(avgAudioSize)
    };
  }

  async validateService(): Promise<boolean> {
    try {
      return await this.whisperClient.validateApiKey();
    } catch (error) {
      console.error('Service validation failed:', error);
      return false;
    }
  }

  setLanguage(language: string): void {
    this.config.language = language;
  }

  getSupportedLanguages(): string[] {
    // Return common language codes supported by Whisper
    return [
      'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh',
      'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
    ];
  }

  isAvailable(): boolean {
    return this.whisperClient !== null;
  }

  dispose(): void {
    this.clearQueue();
    this.clearCache();
    this.removeAllListeners();
  }
}