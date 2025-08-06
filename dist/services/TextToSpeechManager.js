"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextToSpeechManager = void 0;
const ElevenLabsClient_1 = require("./ElevenLabsClient");
/**
 * Manages text-to-speech services with caching and fallback
 */
class TextToSpeechManager {
    constructor(configManager) {
        this.primaryProvider = null;
        this.synthesisCache = new Map();
        this.voiceCache = [];
        this.configManager = configManager;
        this.initializeProviders();
    }
    async initializeProviders() {
        const config = await this.configManager.getConfiguration();
        // Initialize ElevenLabs as primary provider
        if (config.apiKeys.elevenlabs) {
            this.primaryProvider = new ElevenLabsClient_1.ElevenLabsClient(config.apiKeys.elevenlabs);
        }
    }
    async synthesize(text, voiceId) {
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
        }
        catch (error) {
            throw new Error(`Text-to-speech synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAvailableVoices() {
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
        }
        catch (error) {
            throw new Error(`Failed to get available voices: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async cloneVoice(audioSamples, voiceName) {
        if (!this.primaryProvider) {
            throw new Error('No text-to-speech provider available');
        }
        try {
            const voiceId = await this.primaryProvider.cloneVoice(audioSamples, voiceName);
            // Refresh voice cache
            this.voiceCache = [];
            await this.getAvailableVoices();
            return voiceId;
        }
        catch (error) {
            throw new Error(`Voice cloning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteVoice(voiceId) {
        if (!this.primaryProvider) {
            throw new Error('No text-to-speech provider available');
        }
        try {
            await this.primaryProvider.deleteVoice(voiceId);
            // Refresh voice cache
            this.voiceCache = [];
            await this.getAvailableVoices();
        }
        catch (error) {
            throw new Error(`Voice deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    getCacheKey(text, voiceId) {
        return `${text}-${voiceId}`;
    }
    async getVoiceCloningStatus(voiceId) {
        if (!this.primaryProvider) {
            throw new Error('No text-to-speech provider available');
        }
        return await this.primaryProvider.getVoiceCloningStatus(voiceId);
    }
    setVoiceSettings(settings) {
        if (this.primaryProvider) {
            this.primaryProvider.setVoiceSettings(settings);
        }
    }
    isAvailable() {
        return this.primaryProvider?.isAvailable() || false;
    }
    /**
     * Clear synthesis cache
     */
    clearCache() {
        this.synthesisCache.clear();
        this.voiceCache = [];
    }
    /**
     * Update providers when configuration changes
     */
    async updateProviders() {
        await this.initializeProviders();
        this.clearCache();
    }
    /**
     * Get default voice for quick synthesis
     */
    async getDefaultVoice() {
        try {
            const voices = await this.getAvailableVoices();
            return voices.find(voice => !voice.isCloned) || voices[0] || null;
        }
        catch (error) {
            console.warn('Failed to get default voice:', error);
            return null;
        }
    }
}
exports.TextToSpeechManager = TextToSpeechManager;
//# sourceMappingURL=TextToSpeechManager.js.map