"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyManager = void 0;
const ConfigurationManager_1 = require("./ConfigurationManager");
/**
 * Manages API keys with validation and secure storage
 */
class ApiKeyManager {
    constructor() {
        this.configManager = ConfigurationManager_1.ConfigurationManager.getInstance();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ApiKeyManager.instance) {
            ApiKeyManager.instance = new ApiKeyManager();
        }
        return ApiKeyManager.instance;
    }
    /**
     * Get all API keys (returns empty strings for security)
     */
    getApiKeys() {
        const config = this.configManager.getConfig();
        return {
            openai: config.apiKeys.openai ? '***' : '',
            elevenlabs: config.apiKeys.elevenlabs ? '***' : '',
            google: config.apiKeys.google ? '***' : '',
            deepl: config.apiKeys.deepl ? '***' : ''
        };
    }
    /**
     * Set API key for a specific service
     */
    setApiKey(service, apiKey) {
        const config = this.configManager.getConfig();
        config.apiKeys[service] = apiKey.trim();
        this.configManager.updateConfig({ apiKeys: config.apiKeys });
    }
    /**
     * Get API key for a specific service
     */
    getApiKey(service) {
        const config = this.configManager.getConfig();
        return config.apiKeys[service] || '';
    }
    /**
     * Check if API key is configured for a service
     */
    hasApiKey(service) {
        const apiKey = this.getApiKey(service);
        return apiKey.length > 0;
    }
    /**
     * Validate API key format for a specific service
     */
    validateApiKeyFormat(service, apiKey) {
        if (!apiKey || apiKey.trim().length === 0) {
            return false;
        }
        const trimmedKey = apiKey.trim();
        switch (service) {
            case 'openai':
                // OpenAI API keys start with 'sk-' and are typically 51 characters
                return trimmedKey.startsWith('sk-') && trimmedKey.length >= 20;
            case 'elevenlabs':
                // ElevenLabs API keys are typically 32 character hex strings
                return /^[a-f0-9]{32}$/i.test(trimmedKey);
            case 'google':
                // Google API keys are typically 39 characters starting with 'AIza'
                return trimmedKey.startsWith('AIza') && trimmedKey.length === 39;
            case 'deepl':
                // DeepL API keys end with ':fx' for free tier or are UUID-like for pro
                return trimmedKey.endsWith(':fx') ||
                    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(trimmedKey);
            default:
                return false;
        }
    }
    /**
     * Validate API key by making a test request
     */
    async validateApiKey(service, apiKey) {
        if (!this.validateApiKeyFormat(service, apiKey)) {
            return {
                valid: false,
                error: 'Invalid API key format'
            };
        }
        try {
            switch (service) {
                case 'openai':
                    return await this.validateOpenAIKey(apiKey);
                case 'elevenlabs':
                    return await this.validateElevenLabsKey(apiKey);
                case 'google':
                    return await this.validateGoogleKey(apiKey);
                case 'deepl':
                    return await this.validateDeepLKey(apiKey);
                default:
                    return {
                        valid: false,
                        error: 'Unknown service'
                    };
            }
        }
        catch (error) {
            console.error(`Error validating ${service} API key:`, error);
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }
    /**
     * Remove API key for a service
     */
    removeApiKey(service) {
        this.setApiKey(service, '');
    }
    /**
     * Clear all API keys
     */
    clearAllApiKeys() {
        const emptyKeys = {
            openai: '',
            elevenlabs: '',
            google: '',
            deepl: ''
        };
        this.configManager.updateConfig({ apiKeys: emptyKeys });
    }
    /**
     * Get list of services with configured API keys
     */
    getConfiguredServices() {
        const services = ['openai', 'elevenlabs', 'google', 'deepl'];
        return services.filter(service => this.hasApiKey(service));
    }
    /**
     * Get list of services missing API keys
     */
    getMissingServices() {
        const services = ['openai', 'elevenlabs', 'google', 'deepl'];
        return services.filter(service => !this.hasApiKey(service));
    }
    /**
     * Validate OpenAI API key
     */
    async validateOpenAIKey(apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                return { valid: true };
            }
            else if (response.status === 401) {
                return { valid: false, error: 'Invalid API key' };
            }
            else if (response.status === 429) {
                return { valid: false, error: 'Rate limit exceeded' };
            }
            else {
                return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
            }
        }
        catch (error) {
            return {
                valid: false,
                error: 'Network error - unable to validate key'
            };
        }
    }
    /**
     * Validate ElevenLabs API key
     */
    async validateElevenLabsKey(apiKey) {
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/user', {
                method: 'GET',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                return { valid: true };
            }
            else if (response.status === 401) {
                return { valid: false, error: 'Invalid API key' };
            }
            else if (response.status === 429) {
                return { valid: false, error: 'Rate limit exceeded' };
            }
            else {
                return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
            }
        }
        catch (error) {
            return {
                valid: false,
                error: 'Network error - unable to validate key'
            };
        }
    }
    /**
     * Validate Google Translate API key
     */
    async validateGoogleKey(apiKey) {
        try {
            const testUrl = `https://translation.googleapis.com/language/translate/v2/languages?key=${apiKey}`;
            const response = await fetch(testUrl);
            if (response.ok) {
                return { valid: true };
            }
            else if (response.status === 400) {
                return { valid: false, error: 'Invalid API key' };
            }
            else if (response.status === 403) {
                return { valid: false, error: 'API key access denied' };
            }
            else {
                return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
            }
        }
        catch (error) {
            return {
                valid: false,
                error: 'Network error - unable to validate key'
            };
        }
    }
    /**
     * Validate DeepL API key
     */
    async validateDeepLKey(apiKey) {
        try {
            const baseUrl = apiKey.endsWith(':fx')
                ? 'https://api-free.deepl.com/v2/usage'
                : 'https://api.deepl.com/v2/usage';
            const response = await fetch(baseUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                return { valid: true };
            }
            else if (response.status === 403) {
                return { valid: false, error: 'Invalid API key' };
            }
            else if (response.status === 429) {
                return { valid: false, error: 'Rate limit exceeded' };
            }
            else {
                return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
            }
        }
        catch (error) {
            return {
                valid: false,
                error: 'Network error - unable to validate key'
            };
        }
    }
}
exports.ApiKeyManager = ApiKeyManager;
//# sourceMappingURL=ApiKeyManager.js.map