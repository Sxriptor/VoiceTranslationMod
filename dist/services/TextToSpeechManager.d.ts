import { TextToSpeechService, Voice, VoiceCloningStatus, VoiceSettings } from '../interfaces/TextToSpeechService';
import { ConfigurationManager } from './ConfigurationManager';
/**
 * Manages text-to-speech services with caching and fallback
 */
export declare class TextToSpeechManager implements TextToSpeechService {
    private configManager;
    private primaryProvider;
    private synthesisCache;
    private voiceCache;
    constructor(configManager: ConfigurationManager);
    private initializeProviders;
    synthesize(text: string, voiceId: string): Promise<ArrayBuffer>;
    getAvailableVoices(): Promise<Voice[]>;
    cloneVoice(audioSamples: ArrayBuffer[], voiceName: string): Promise<string>;
    deleteVoice(voiceId: string): Promise<void>;
    private getCacheKey;
    getVoiceCloningStatus(voiceId: string): Promise<VoiceCloningStatus>;
    setVoiceSettings(settings: VoiceSettings): void;
    isAvailable(): boolean;
    /**
     * Clear synthesis cache
     */
    clearCache(): void;
    /**
     * Update providers when configuration changes
     */
    updateProviders(): Promise<void>;
    /**
     * Get default voice for quick synthesis
     */
    getDefaultVoice(): Promise<Voice | null>;
}
//# sourceMappingURL=TextToSpeechManager.d.ts.map