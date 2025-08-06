import { TranslationService, TranslationResult, TranslationProvider } from '../interfaces/TranslationService';
import { ConfigurationManager } from './ConfigurationManager';
/**
 * Manages translation services with provider selection and failover
 */
export declare class TranslationServiceManager implements TranslationService {
    private configManager;
    private primaryProvider;
    private fallbackProviders;
    private translationCache;
    private currentProvider;
    constructor(configManager: ConfigurationManager);
    private initializeProviders;
    translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult>;
    getSupportedLanguages(): string[];
    setProvider(provider: TranslationProvider): void;
    getCurrentProvider(): TranslationProvider;
    isAvailable(): boolean;
    isLanguagePairSupported(sourceLanguage: string, targetLanguage: string): boolean;
    private getCacheKey;
    /**
     * Clear translation cache
     */
    clearCache(): void;
    /**
     * Update providers when configuration changes
     */
    updateProviders(): Promise<void>;
}
//# sourceMappingURL=TranslationServiceManager.d.ts.map