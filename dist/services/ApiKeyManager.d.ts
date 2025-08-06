import { ApiKeys } from '../types/ConfigurationTypes';
/**
 * Manages API keys with validation and secure storage
 */
export declare class ApiKeyManager {
    private static instance;
    private configManager;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): ApiKeyManager;
    /**
     * Get all API keys (returns empty strings for security)
     */
    getApiKeys(): ApiKeys;
    /**
     * Set API key for a specific service
     */
    setApiKey(service: keyof ApiKeys, apiKey: string): void;
    /**
     * Get API key for a specific service
     */
    getApiKey(service: keyof ApiKeys): string;
    /**
     * Check if API key is configured for a service
     */
    hasApiKey(service: keyof ApiKeys): boolean;
    /**
     * Validate API key format for a specific service
     */
    validateApiKeyFormat(service: keyof ApiKeys, apiKey: string): boolean;
    /**
     * Validate API key by making a test request
     */
    validateApiKey(service: keyof ApiKeys, apiKey: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
    /**
     * Remove API key for a service
     */
    removeApiKey(service: keyof ApiKeys): void;
    /**
     * Clear all API keys
     */
    clearAllApiKeys(): void;
    /**
     * Get list of services with configured API keys
     */
    getConfiguredServices(): (keyof ApiKeys)[];
    /**
     * Get list of services missing API keys
     */
    getMissingServices(): (keyof ApiKeys)[];
    /**
     * Validate OpenAI API key
     */
    private validateOpenAIKey;
    /**
     * Validate ElevenLabs API key
     */
    private validateElevenLabsKey;
    /**
     * Validate Google Translate API key
     */
    private validateGoogleKey;
    /**
     * Validate DeepL API key
     */
    private validateDeepLKey;
}
//# sourceMappingURL=ApiKeyManager.d.ts.map