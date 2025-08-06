import { TranslationService, TranslationResult, TranslationProvider } from '../interfaces/TranslationService';
/**
 * OpenAI-based translation service using GPT models
 */
export declare class OpenAITranslationClient implements TranslationService {
    private apiKey;
    private baseUrl;
    private model;
    constructor(apiKey: string);
    translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult>;
    detectLanguage(text: string): Promise<string>;
    getSupportedLanguages(): string[];
    setProvider(provider: TranslationProvider): void;
    getCurrentProvider(): TranslationProvider;
    isAvailable(): boolean;
    isLanguagePairSupported(sourceLanguage: string, targetLanguage: string): boolean;
    private buildTranslationPrompt;
    private getLanguageName;
}
//# sourceMappingURL=OpenAITranslationClient.d.ts.map