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
        this.configManager = configManager;
        this.initializeProviders();
    }
    async initializeProviders() {
        const config = await this.configManager.getConfiguration();
        // Initialize OpenAI as primary provider
        if (config.apiKeys.openai) {
            this.primaryProvider = new OpenAITranslationClient_1.OpenAITranslationClient(config.apiKeys.openai);
        }
    }
    async translate(text, targetLanguage, sourceLanguage) {
        // Check cache first
        const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
        const cachedResult = this.translationCache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        // Try primary provider first
        if (this.primaryProvider) {
            try {
                const result = await this.primaryProvider.translate(text, targetLanguage, sourceLanguage);
                this.translationCache.set(cacheKey, result);
                return result;
            }
            catch (error) {
                console.warn('Primary translation provider failed:', error);
            }
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
        return this.primaryProvider?.isAvailable() || false;
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
        await this.initializeProviders();
        this.clearCache();
    }
}
exports.TranslationServiceManager = TranslationServiceManager;
//# sourceMappingURL=TranslationServiceManager.js.map