"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationServiceManager = void 0;
const OpenAITranslationClient_1 = require("./OpenAITranslationClient");
/**
 * Manages translation services with provider selection and failover
 */
class TranslationServiceManager {
    constructor(configManager) {
        this.primaryProvider = null;
        this.fallbackProviders = [];
        this.translationCache = new Map();
        this.currentProvider = 'openai';
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
        // Initialize OpenAI as primary provider
        if (config.apiKeys.openai && config.apiKeys.openai.trim().length > 0) {
            this.primaryProvider = new OpenAITranslationClient_1.OpenAITranslationClient(config.apiKeys.openai);
            console.log('OpenAI translation provider initialized');
        }
        else {
            console.warn('OpenAI API key not found or empty');
        }
    }
    async translate(text, targetLanguage, sourceLanguage) {
        // Ensure providers are initialized
        await this.ensureInitialized();
        // Check cache first
        const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
        const cachedResult = this.translationCache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        // Try primary provider first
        if (this.primaryProvider) {
            try {
                console.log(`Translating "${text}" from ${sourceLanguage || 'auto'} to ${targetLanguage}`);
                const result = await this.primaryProvider.translate(text, targetLanguage, sourceLanguage);
                this.translationCache.set(cacheKey, result);
                console.log(`Translation successful: "${result.translatedText}"`);
                return result;
            }
            catch (error) {
                console.error('Primary translation provider failed:', error);
            }
        }
        else {
            console.error('No primary translation provider available');
        }
        // Try fallback providers
        for (const provider of this.fallbackProviders) {
            try {
                const result = await provider.translate(text, targetLanguage, sourceLanguage);
                this.translationCache.set(cacheKey, result);
                return result;
            }
            catch (error) {
                console.warn('Fallback translation provider failed:', error);
            }
        }
        throw new Error('All translation providers failed');
    }
    getSupportedLanguages() {
        if (this.primaryProvider) {
            try {
                return this.primaryProvider.getSupportedLanguages();
            }
            catch (error) {
                console.warn('Failed to get supported languages:', error);
            }
        }
        // Return basic language set as fallback
        return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
    }
    setProvider(provider) {
        this.currentProvider = provider;
        // In a full implementation, this would switch the active provider
    }
    getCurrentProvider() {
        return this.currentProvider;
    }
    isAvailable() {
        // Check if we have a configured API key
        const config = this.configManager.getConfig();
        return !!(config.apiKeys.openai && config.apiKeys.openai.trim().length > 0);
    }
    isLanguagePairSupported(sourceLanguage, targetLanguage) {
        return this.primaryProvider?.isLanguagePairSupported(sourceLanguage, targetLanguage) || false;
    }
    getCacheKey(text, targetLanguage, sourceLanguage) {
        return `${sourceLanguage || 'auto'}-${targetLanguage}-${text}`;
    }
    /**
     * Clear translation cache
     */
    clearCache() {
        this.translationCache.clear();
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
}
exports.TranslationServiceManager = TranslationServiceManager;
//# sourceMappingURL=TranslationServiceManager.js.map