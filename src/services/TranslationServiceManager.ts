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

    constructor(configManager: ConfigurationManager) {
        this.configManager = configManager;
        this.initializeProviders();
    }

    private async initializeProviders(): Promise<void> {
        const config = await this.configManager.getConfiguration();
        
        // Initialize OpenAI as primary provider
        if (config.apiKeys.openai) {
            this.primaryProvider = new OpenAITranslationClient(config.apiKeys.openai);
        }
    }

    async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult> {
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
            } catch (error) {
                console.warn('Primary translation provider failed:', error);
            }
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
        return this.primaryProvider?.isAvailable() || false;
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
        await this.initializeProviders();
        this.clearCache();
    }
}