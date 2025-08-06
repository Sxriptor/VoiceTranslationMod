export interface AudioConversionOptions {
    targetSampleRate?: number;
    targetChannels?: number;
    targetFormat?: 'wav' | 'mp3' | 'flac';
    quality?: number;
}
export interface ConversionResult {
    blob: Blob;
    format: string;
    sampleRate: number;
    channels: number;
    duration: number;
    size: number;
}
export declare class AudioFormatConverter {
    private static readonly WHISPER_OPTIMAL_SAMPLE_RATE;
    private static readonly WHISPER_OPTIMAL_CHANNELS;
    static convertForWhisper(audioData: Float32Array, originalSampleRate: number, options?: Partial<AudioConversionOptions>): Promise<ConversionResult>;
    private static resample;
    private static convertToFormat;
    private static convertToWav;
    private static convertToMp3;
    private static convertToFlac;
    static optimizeForWhisper(audioData: Float32Array, originalSampleRate: number): Promise<ConversionResult>;
    private static normalizeAudio;
    private static applyNoiseGate;
    private static applyHighPassFilter;
    static validateAudioForWhisper(blob: Blob): {
        valid: boolean;
        issues: string[];
    };
    static estimateTranscriptionCost(audioData: Float32Array, sampleRate: number): number;
}
//# sourceMappingURL=AudioFormatConverter.d.ts.map