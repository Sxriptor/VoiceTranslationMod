"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const ConfigurationTypes_1 = require("../types/ConfigurationTypes");
/**
 * Manages application configuration with file-based persistence
 */
class ConfigurationManager {
    constructor() {
        this.configFileName = 'config.json';
        // Get user data directory
        const userDataPath = electron_1.app.getPath('userData');
        this.configPath = path.join(userDataPath, this.configFileName);
        // Load configuration
        this.config = this.loadConfiguration();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ConfigurationManager.instance) {
            ConfigurationManager.instance = new ConfigurationManager();
        }
        return ConfigurationManager.instance;
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config }; // Return a copy to prevent direct mutation
    }
    /**
     * Get current configuration (alias for getConfig)
     */
    getConfiguration() {
        return this.getConfig();
    }
    /**
     * Update configuration with partial changes
     */
    updateConfig(updates) {
        // Deep merge the updates with current config
        this.config = this.deepMerge(this.config, updates);
        // Validate the updated configuration
        this.validateConfiguration(this.config);
        // Save to file
        this._saveConfiguration();
    }
    /**
     * Reset configuration to defaults
     */
    resetToDefaults() {
        this.config = this.getDefaultConfiguration();
        this._saveConfiguration();
    }
    /**
     * Get specific configuration value by path
     */
    getValue(path) {
        return this.getNestedValue(this.config, path);
    }
    /**
     * Set specific configuration value by path
     */
    setValue(path, value) {
        this.setNestedValue(this.config, path, value);
        this.validateConfiguration(this.config);
        this._saveConfiguration();
    }
    /**
     * Check if configuration file exists
     */
    configExists() {
        return fs.existsSync(this.configPath);
    }
    /**
     * Get configuration file path
     */
    getConfigPath() {
        return this.configPath;
    }
    /**
     * Load configuration from file or create default
     */
    loadConfiguration() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                const loadedConfig = JSON.parse(configData);
                // Merge with defaults to ensure all properties exist
                const defaultConfig = this.getDefaultConfiguration();
                const mergedConfig = this.deepMerge(defaultConfig, loadedConfig);
                // Validate the loaded configuration
                this.validateConfiguration(mergedConfig);
                console.log('Configuration loaded from:', this.configPath);
                return mergedConfig;
            }
        }
        catch (error) {
            console.error('Error loading configuration:', error);
        }
        // Return default configuration if loading failed
        console.log('Using default configuration');
        return this.getDefaultConfiguration();
    }
    /**
     * Save configuration to file
     */
    saveConfiguration(config) {
        if (config) {
            this.config = config;
            this.validateConfiguration(this.config);
        }
        this._saveConfiguration();
    }
    /**
     * Internal save configuration to file
     */
    _saveConfiguration() {
        try {
            // Ensure directory exists
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            // Write configuration to file
            const configData = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(this.configPath, configData, 'utf8');
            console.log('Configuration saved to:', this.configPath);
        }
        catch (error) {
            console.error('Error saving configuration:', error);
            throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get default configuration
     */
    getDefaultConfiguration() {
        return {
            selectedMicrophone: '',
            targetLanguage: 'ru',
            sourceLanguage: 'en',
            translationProvider: ConfigurationTypes_1.TranslationProvider.OPENAI,
            voiceId: '',
            debugMode: false,
            apiKeys: {
                openai: '',
                elevenlabs: '',
                google: '',
                deepl: ''
            },
            audioSettings: {
                vadSensitivity: 50,
                minSegmentDuration: 1000,
                maxSegmentDuration: 10000,
                quality: ConfigurationTypes_1.AudioQuality.MEDIUM,
                noiseReduction: true,
                autoGainControl: true,
                echoCancellation: true
            },
            voiceSettings: {
                stability: 0.5,
                similarityBoost: 0.5,
                speed: 1.0,
                quality: ConfigurationTypes_1.TTSQuality.MEDIUM
            },
            uiSettings: {
                theme: 'auto',
                windowBounds: {
                    width: 1200,
                    height: 800,
                    maximized: false
                },
                showDebugConsole: false,
                uiLanguage: 'en',
                showNotifications: true
            },
            customVoices: []
        };
    }
    /**
     * Validate configuration object
     */
    validateConfiguration(config) {
        // Basic validation - ensure required properties exist
        if (!config) {
            throw new Error('Configuration is null or undefined');
        }
        // Validate API keys object
        if (!config.apiKeys || typeof config.apiKeys !== 'object') {
            throw new Error('Invalid API keys configuration');
        }
        // Validate audio settings
        if (!config.audioSettings || typeof config.audioSettings !== 'object') {
            throw new Error('Invalid audio settings configuration');
        }
        // Validate voice settings
        if (!config.voiceSettings || typeof config.voiceSettings !== 'object') {
            throw new Error('Invalid voice settings configuration');
        }
        // Validate UI settings
        if (!config.uiSettings || typeof config.uiSettings !== 'object') {
            throw new Error('Invalid UI settings configuration');
        }
        // Validate enum values
        if (!Object.values(ConfigurationTypes_1.TranslationProvider).includes(config.translationProvider)) {
            console.warn('Invalid translation provider, using default');
            config.translationProvider = ConfigurationTypes_1.TranslationProvider.OPENAI;
        }
        if (!Object.values(ConfigurationTypes_1.AudioQuality).includes(config.audioSettings.quality)) {
            console.warn('Invalid audio quality, using default');
            config.audioSettings.quality = ConfigurationTypes_1.AudioQuality.MEDIUM;
        }
        if (!Object.values(ConfigurationTypes_1.TTSQuality).includes(config.voiceSettings.quality)) {
            console.warn('Invalid TTS quality, using default');
            config.voiceSettings.quality = ConfigurationTypes_1.TTSQuality.MEDIUM;
        }
        // Validate numeric ranges
        config.audioSettings.vadSensitivity = Math.max(0, Math.min(100, config.audioSettings.vadSensitivity));
        config.voiceSettings.stability = Math.max(0, Math.min(1, config.voiceSettings.stability));
        config.voiceSettings.similarityBoost = Math.max(0, Math.min(1, config.voiceSettings.similarityBoost));
        config.voiceSettings.speed = Math.max(0.1, Math.min(3.0, config.voiceSettings.speed));
    }
    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key] || {}, source[key]);
                }
                else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }
    /**
     * Get nested value from object using dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    /**
     * Set nested value in object using dot notation
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
}
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=ConfigurationManager.js.map