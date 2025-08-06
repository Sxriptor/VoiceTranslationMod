/**
 * Service interface for converting text to speech with voice cloning
 */
export interface TextToSpeechService {
    /**
     * Synthesize text to speech using specified voice
     * @param text - Text to convert to speech
     * @param voiceId - ID of the voice to use
     * @returns Promise resolving to audio buffer
     */
    synthesize(text: string, voiceId: string): Promise<ArrayBuffer>;
    /**
     * Get list of available voices
     * @returns Promise resolving to array of available voices
     */
    getAvailableVoices(): Promise<Voice[]>;
    /**
     * Clone a voice from audio samples
     * @param audioSamples - Array of audio samples for voice cloning
     * @param voiceName - Name for the cloned voice
     * @returns Promise resolving to the new voice ID
     */
    cloneVoice(audioSamples: ArrayBuffer[], voiceName: string): Promise<string>;
    /**
     * Get voice cloning status
     * @param voiceId - ID of the voice being cloned
     * @returns Promise resolving to cloning status
     */
    getVoiceCloningStatus(voiceId: string): Promise<VoiceCloningStatus>;
    /**
     * Set voice synthesis settings
     * @param settings - Voice synthesis configuration
     */
    setVoiceSettings(settings: VoiceSettings): void;
    /**
     * Check if the service is available and configured
     * @returns True if service is ready to use
     */
    isAvailable(): boolean;
    /**
     * Delete a cloned voice
     * @param voiceId - ID of the voice to delete
     * @returns Promise that resolves when voice is deleted
     */
    deleteVoice(voiceId: string): Promise<void>;
}
/**
 * Represents a voice profile
 */
export interface Voice {
    /** Unique voice identifier */
    id: string;
    /** Human-readable voice name */
    name: string;
    /** Whether this is a cloned voice */
    isCloned: boolean;
    /** Language/accent of the voice */
    language?: string;
    /** Gender of the voice */
    gender?: 'male' | 'female' | 'neutral';
    /** Voice preview URL if available */
    previewUrl?: string;
}
/**
 * Voice cloning status information
 */
export interface VoiceCloningStatus {
    /** Current status of the cloning process */
    status: 'pending' | 'processing' | 'completed' | 'failed';
    /** Progress percentage (0-100) */
    progress: number;
    /** Error message if cloning failed */
    error?: string;
    /** Estimated time remaining in seconds */
    estimatedTimeRemaining?: number;
}
/**
 * Voice synthesis settings
 */
export interface VoiceSettings {
    /** Stability setting (0-1) */
    stability?: number;
    /** Similarity boost (0-1) */
    similarityBoost?: number;
    /** Speaking rate multiplier */
    speed?: number;
    /** Audio quality setting */
    quality?: 'low' | 'medium' | 'high';
}
//# sourceMappingURL=TextToSpeechService.d.ts.map