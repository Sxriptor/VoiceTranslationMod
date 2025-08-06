import { ConfigurationManager } from './ConfigurationManager';
import { ApiKeys } from '../types/ConfigurationTypes';
import { ApiError, ErrorCodes } from '../types/ErrorTypes';

/**
 * Manages API keys with validation and secure storage
 */
export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private configManager: ConfigurationManager;

  private constructor() {
    this.configManager = ConfigurationManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  /**
   * Get all API keys (returns empty strings for security)
   */
  public getApiKeys(): ApiKeys {
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
  public setApiKey(service: keyof ApiKeys, apiKey: string): void {
    const config = this.configManager.getConfig();
    config.apiKeys[service] = apiKey.trim();
    this.configManager.updateConfig({ apiKeys: config.apiKeys });
  }

  /**
   * Get API key for a specific service
   */
  public getApiKey(service: keyof ApiKeys): string {
    const config = this.configManager.getConfig();
    return config.apiKeys[service] || '';
  }

  /**
   * Check if API key is configured for a service
   */
  public hasApiKey(service: keyof ApiKeys): boolean {
    const apiKey = this.getApiKey(service);
    return apiKey.length > 0;
  }

  /**
   * Validate API key format for a specific service
   */
  public validateApiKeyFormat(service: keyof ApiKeys, apiKey: string): boolean {
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
  public async validateApiKey(service: keyof ApiKeys, apiKey: string): Promise<{ valid: boolean; error?: string }> {
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
    } catch (error) {
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
  public removeApiKey(service: keyof ApiKeys): void {
    this.setApiKey(service, '');
  }

  /**
   * Clear all API keys
   */
  public clearAllApiKeys(): void {
    const emptyKeys: ApiKeys = {
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
  public getConfiguredServices(): (keyof ApiKeys)[] {
    const services: (keyof ApiKeys)[] = ['openai', 'elevenlabs', 'google', 'deepl'];
    return services.filter(service => this.hasApiKey(service));
  }

  /**
   * Get list of services missing API keys
   */
  public getMissingServices(): (keyof ApiKeys)[] {
    const services: (keyof ApiKeys)[] = ['openai', 'elevenlabs', 'google', 'deepl'];
    return services.filter(service => !this.hasApiKey(service));
  }

  /**
   * Validate OpenAI API key
   */
  private async validateOpenAIKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
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
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded' };
      } else {
        return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Network error - unable to validate key'
      };
    }
  }

  /**
   * Validate ElevenLabs API key
   */
  private async validateElevenLabsKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
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
      } else if (response.status === 401) {
        return { valid: false, error: 'Invalid API key' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded' };
      } else {
        return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Network error - unable to validate key'
      };
    }
  }

  /**
   * Validate Google Translate API key
   */
  private async validateGoogleKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const testUrl = `https://translation.googleapis.com/language/translate/v2/languages?key=${apiKey}`;
      const response = await fetch(testUrl);

      if (response.ok) {
        return { valid: true };
      } else if (response.status === 400) {
        return { valid: false, error: 'Invalid API key' };
      } else if (response.status === 403) {
        return { valid: false, error: 'API key access denied' };
      } else {
        return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Network error - unable to validate key'
      };
    }
  }

  /**
   * Validate DeepL API key
   */
  private async validateDeepLKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
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
      } else if (response.status === 403) {
        return { valid: false, error: 'Invalid API key' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Rate limit exceeded' };
      } else {
        return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Network error - unable to validate key'
      };
    }
  }
}