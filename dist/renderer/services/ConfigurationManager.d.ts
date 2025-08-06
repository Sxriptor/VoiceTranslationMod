import { AppConfig } from '../types/ConfigurationTypes';
/**
 * Manages application configuration with file-based persistence
 */
export declare class ConfigurationManager {
    private static instance;
    private config;
    private configPath;
    private readonly configFileName;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): ConfigurationManager;
    /**
     * Get current configuration
     */
    getConfig(): AppConfig;
    /**
     * Get current configuration (alias for getConfig)
     */
    getConfiguration(): AppConfig;
    /**
     * Update configuration with partial changes
     */
    updateConfig(updates: Partial<AppConfig>): void;
    /**
     * Reset configuration to defaults
     */
    resetToDefaults(): void;
    /**
     * Get specific configuration value by path
     */
    getValue<T>(path: string): T | undefined;
    /**
     * Set specific configuration value by path
     */
    setValue(path: string, value: any): void;
    /**
     * Check if configuration file exists
     */
    configExists(): boolean;
    /**
     * Get configuration file path
     */
    getConfigPath(): string;
    /**
     * Load configuration from file or create default
     */
    private loadConfiguration;
    /**
     * Save configuration to file
     */
    saveConfiguration(config?: AppConfig): void;
    /**
     * Internal save configuration to file
     */
    private _saveConfiguration;
    /**
     * Get default configuration
     */
    private getDefaultConfiguration;
    /**
     * Validate configuration object
     */
    private validateConfiguration;
    /**
     * Deep merge two objects
     */
    private deepMerge;
    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue;
    /**
     * Set nested value in object using dot notation
     */
    private setNestedValue;
}
//# sourceMappingURL=ConfigurationManager.d.ts.map