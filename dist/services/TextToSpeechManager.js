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
        this.initialized = false;
        this.configManager = configManager;
        // Don't call async method in constructor
    }
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initializeProviders();
            this.initialized = true;
        }
    }
    async initializeProviders() {
        const config = this.configManager.getConfig(); // Use sync method
        // Initialize ElevenLabs as primary provider
        if (config.apiKeys.elevenlabs && config.apiKeys.elevenlabs.trim().length > 0) {
            this.primaryProvider = new ElevenLabsClient_1.ElevenLabsClient(config.apiKeys.elevenlabs);
            console.log('ElevenLabs TTS provider initialized');
        }
        else {
            console.warn('ElevenLabs API key not found or empty');
        }
    }
    async synthesize(text, voiceId) {
        // Ensure providers are initialized
        await this.ensureInitialized();
        // Check cache first
        const cacheKey = this.getCacheKey(text, voiceId);
        const cachedResult = this.synthesisCache.get(cacheKey);
        if (cachedResult) {
            console.log('Using cached TTS result');
            return cachedResult;
        }
        if (!this.primaryProvider) {
            throw new Error('No text-to-speech provider available');
        }
        try {
            console.log(`Synthesizing speech: "${text}" with voice ${voiceId}`);
            const result = await this.primaryProvider.synthesize(text, voiceId);
            // Cache the result (limit cache size)
            if (this.synthesisCache.size > 50) {
                const firstKey = this.synthesisCache.keys().next().value;
                if (firstKey) {
                    this.synthesisCache.delete(firstKey);
                }
            }
            this.synthesisCache.set(cacheKey, result);
            console.log(`TTS synthesis successful: ${result.byteLength} bytes`);
            return result;
        }
        catch (error) {
            console.error('TTS synthesis failed:', error);
            throw new Error(`Text-to-speech synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getAvailableVoices() {
        // Ensure providers are initialized
        await this.ensureInitialized();
        // Return cached voices if available
        if (this.voiceCache.length > 0) {
            return this.voiceCache;
        }
        if (!this.primaryProvider) {
            // Return mock voices if no provider is available
            console.warn('No TTS provider available, returning mock voices');
            return [
                { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Male, English)', isCloned: false },
                { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Female, English)', isCloned: false },
                { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Male, English)', isCloned: false },
                { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Male, English)', isCloned: false }
            ];
        }
        try {
            this.voiceCache = await this.primaryProvider.getAvailableVoices();
            return this.voiceCache;
        }
        catch (error) {
            console.error('Failed to get available voices:', error);
            // Return mock voices as fallback
            return [
                { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Male, English)', isCloned: false },
                { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Female, English)', isCloned: false },
                { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Male, English)', isCloned: false },
                { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Male, English)', isCloned: false }
            ];
        }
    }
    async cloneVoice(audioSamples, voiceName) {
        await this.ensureInitialized();
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
        // Check if we have a configured API key
        const config = this.configManager.getConfig();
        return !!(config.apiKeys.elevenlabs && config.apiKeys.elevenlabs.trim().length > 0);
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
        this.initialized = false;
        this.primaryProvider = null;
        await this.initializeProviders();
        this.initialized = true;
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