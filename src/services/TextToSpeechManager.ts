import { TextToSpeechService, Voice, VoiceCloningStatus, VoiceSettings } from '../interfaces/TextToSpeechService';
import { ElevenLabsClient } from './ElevenLabsClient';
import { ConfigurationManager } from './ConfigurationManager';

/**
 * Manages text-to-speech services with caching and fallback
 */
export class TextToSpeechManager implements TextToSpeechService {
    private configManager: ConfigurationManager;
    private primaryProvider: TextToSpeechService | null = null;
    private synthesisCache: Map<string, ArrayBuffer> = new Map();
    private voiceCache: Voice[] = [];

    constructor(configManager: ConfigurationManager) {
        this.configManager = configManager;
        this.initializeProviders();
    }

    private async initializeProviders(): Promise<void> {
        const config = await this.configManager.getConfiguration();
        
        // Initialize ElevenLabs as primary provider
        if (config.apiKeys.elevenlabs) {
            this.primaryProvider = new ElevenLabsClient(config.apiKeys.elevenlabs);
        }
    }

    async synthesize(text: string, voiceId: string): Promise<ArrayBuffer> {
        // Check cache first
        const cacheKey = this.getCacheKey(text, voiceId);
        const cachedResult = this.synthesisCache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        if (!this.primaryProvider) {
            throw new Error('No text-to-speech provider available');
        }

        try {
            const result = await this.primaryProvider.synthesize(text, voiceId);
            
            // Cache the result (limit cache size)
            if (this.synthesisCache.size > 50) {
                const firstKey = this.synthesisCache.keys().next().value;
                if (firstKey) {
                    this.synthesisCache.delete(firstKey);
                }
            }
            
            this.synthesisCache.set(cacheKey, result);
            return result;

        } catch (error) {
            throw new Error(`Text-to-speech synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getAvailableVoices(): Promise<Voice[]> {
        // Return cached voices if available
        if (this.voiceCache.length > 0) {
            return this.voiceCache;
        }

        if (!this.primaryProvider) {
            throw new Error('No text-to-speech provider available');
        }

        try {
            this.voiceCache = await this.primaryProvider.getAvailableVoices();
            return this.voiceCache;

        } catch (error) {
            throw new Error(`Failed to get available voices: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async cloneVoice(audioSamples: ArrayBuffer[], voiceName: string): Promise<string> {
        if (!this.primaryProvider) {
            throw new Error('No text-to-speech provider available');
        }

        try {
            const voiceId = await this.primaryProvider.cloneVoice(audioSamples, voiceName);
            
            // Refresh voice cache
            this.voiceCache = [];
            await this.getAvailableVoices();
            
            return voiceId;

        } catch (error) {
            throw new Error(`Voice cloning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async deleteVoice(voiceId: string): Promise<void> {
        if (!this.primaryProvider) {
            throw new Error('No text-to-speech provider available');
        }

        try {
            await this.primaryProvider.deleteVoice(voiceId);
            
            // Refresh voice cache
            this.voiceCache = [];
            await this.getAvailableVoices();

        } catch (error) {
            throw new Error(`Voice deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private getCacheKey(text: string, voiceId: string): string {
        return `${text}-${voiceId}`;
    }

    async getVoiceCloningStatus(voiceId: string): Promise<VoiceCloningStatus> {
        if (!this.primaryProvider) {
            throw new Error('No text-to-speech provider available');
        }

        return await this.primaryProvider.getVoiceCloningStatus(voiceId);
    }

    setVoiceSettings(settings: VoiceSettings): void {
        if (this.primaryProvider) {
            this.primaryProvider.setVoiceSettings(settings);
        }
    }

    isAvailable(): boolean {
        return this.primaryProvider?.isAvailable() || false;
    }

    /**
     * Clear synthesis cache
     */
    clearCache(): void {
        this.synthesisCache.clear();
        this.voiceCache = [];
    }

    /**
     * Update providers when configuration changes
     */
    async updateProviders(): Promise<void> {
        await this.initializeProviders();
        this.clearCache();
    }

    /**
     * Get default voice for quick synthesis
     */
    async getDefaultVoice(): Promise<Voice | null> {
        try {
            const voices = await this.getAvailableVoices();
            return voices.find(voice => !voice.isCloned) || voices[0] || null;
        } catch (error) {
            console.warn('Failed to get default voice:', error);
            return null;
        }
    }
}