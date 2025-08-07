import { TranslationService, TranslationResult, TranslationProvider } from '../interfaces/TranslationService';
import { OpenAITranslationClient } from './OpenAITranslationClient';
import { ConfigurationManager } from './ConfigurationManager';

/**
 * Manages translation services with provider selection and failover
 */
export class TranslationServiceManager implements TranslationService {
    private configManager: ConfigurationManager;
    private primaryProvider: TranslationService | null = null;
    private fallbackProviders: TranslationService[] = [];
    private translationCache: Map<string, TranslationResult> = new Map();
    private currentProvider: TranslationProvider = 'openai';
    private initialized: boolean = false;

    constructor(configManager: ConfigurationManager) {
        this.configManager = configManager;
        // Don't call async method in constructor
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initializeProviders();
            this.initialized = true;
        }
    }

    private async initializeProviders(): Promise<void> {
        const config = this.configManager.getConfig(); // Use sync method
        
        // Initialize OpenAI as primary provider
        if (config.apiKeys.openai && config.apiKeys.openai.trim().length > 0) {
            this.primaryProvider = new OpenAITranslationClient(config.apiKeys.openai);
            console.log('OpenAI translation provider initialized');
        } else {
            console.warn('OpenAI API key not found or empty');
        }
    }

    async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult> {
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
            } catch (error) {
                console.error('Primary translation provider failed:', error);
            }
        } else {
            console.error('No primary translation provider available');
        }

        // Try fallback providers
        for (const provider of this.fallbackProviders) {
            try {
                const result = await provider.translate(text, targetLanguage, sourceLanguage);
                this.translationCache.set(cacheKey, result);
                return result;
            } catch (error) {
                console.warn('Fallback translation provider failed:', error);
            }
        }

        throw new Error('All translation providers failed');
    }

    getSupportedLanguages(): string[] {
        if (this.primaryProvider) {
            try {
                return this.primaryProvider.getSupportedLanguages();
            } catch (error) {
                console.warn('Failed to get supported languages:', error);
            }
        }

        // Return basic language set as fallback
        return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
    }

    setProvider(provider: TranslationProvider): void {
        this.currentProvider = provider;
        // In a full implementation, this would switch the active provider
    }

    getCurrentProvider(): TranslationProvider {
        return this.currentProvider;
    }

    isAvailable(): boolean {
        // Check if we have a configured API key
        const config = this.configManager.getConfig();
        return !!(config.apiKeys.openai && config.apiKeys.openai.trim().length > 0);
    }

    isLanguagePairSupported(sourceLanguage: string, targetLanguage: string): boolean {
        return this.primaryProvider?.isLanguagePairSupported(sourceLanguage, targetLanguage) || false;
    }

    private getCacheKey(text: string, targetLanguage: string, sourceLanguage?: string): string {
        return `${sourceLanguage || 'auto'}-${targetLanguage}-${text}`;
    }

    /**
     * Clear translation cache
     */
    clearCache(): void {
        this.translationCache.clear();
    }

    /**
     * Update providers when configuration changes
     */
    async updateProviders(): Promise<void> {
        this.initialized = false;
        this.primaryProvider = null;
        await this.initializeProviders();
        this.initialized = true;
        this.clearCache();
    }
}