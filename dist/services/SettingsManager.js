"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsManager = void 0;
const ConfigurationManager_1 = require("./ConfigurationManager");
/**
 * Manages user preferences and settings with automatic persistence
 */
class SettingsManager {
    constructor() {
        this.settingsVersion = '1.0.0';
        this.configManager = ConfigurationManager_1.ConfigurationManager.getInstance();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }
    /**
     * Save user preference
     */
    saveSetting(key, value) {
        try {
            this.configManager.setValue(key, value);
            console.log(`Setting saved: ${key} = ${JSON.stringify(value)}`);
        }
        catch (error) {
            console.error(`Error saving setting ${key}:`, error);
            throw error;
        }
    }
    /**
     * Get user preference
     */
    getSetting(key, defaultValue) {
        try {
            const value = this.configManager.getValue(key);
            return value !== undefined ? value : defaultValue;
        }
        catch (error) {
            console.error(`Error getting setting ${key}:`, error);
            return defaultValue;
        }
    }
    /**
     * Save microphone selection
     */
    saveSelectedMicrophone(deviceId) {
        this.saveSetting('selectedMicrophone', deviceId);
    }
    /**
     * Get selected microphone
     */
    getSelectedMicrophone() {
        return this.getSetting('selectedMicrophone', '') || '';
    }
    /**
     * Save target language
     */
    saveTargetLanguage(languageCode) {
        this.saveSetting('targetLanguage', languageCode);
    }
    /**
     * Get target language
     */
    getTargetLanguage() {
        return this.getSetting('targetLanguage', 'ru') || 'ru';
    }
    /**
     * Save source language
     */
    saveSourceLanguage(languageCode) {
        this.saveSetting('sourceLanguage', languageCode);
    }
    /**
     * Get source language
     */
    getSourceLanguage() {
        return this.getSetting('sourceLanguage', 'en') || 'en';
    }
    /**
     * Save translation provider preference
     */
    saveTranslationProvider(provider) {
        this.saveSetting('translationProvider', provider);
    }
    /**
     * Get translation provider preference
     */
    getTranslationProvider() {
        return this.getSetting('translationProvider', 'openai') || 'openai';
    }
    /**
     * Save voice ID for TTS
     */
    saveVoiceId(voiceId) {
        this.saveSetting('voiceId', voiceId);
    }
    /**
     * Get voice ID for TTS
     */
    getVoiceId() {
        return this.getSetting('voiceId', '') || '';
    }
    /**
     * Save debug mode preference
     */
    saveDebugMode(enabled) {
        this.saveSetting('debugMode', enabled);
    }
    /**
     * Get debug mode preference
     */
    getDebugMode() {
        return this.getSetting('debugMode', false) || false;
    }
    /**
     * Save window bounds
     */
    saveWindowBounds(bounds) {
        this.saveSetting('uiSettings.windowBounds', bounds);
    }
    /**
     * Get window bounds
     */
    getWindowBounds() {
        return this.getSetting('uiSettings.windowBounds', {
            width: 1200,
            height: 800,
            maximized: false
        }) || {
            width: 1200,
            height: 800,
            maximized: false
        };
    }
    /**
     * Save UI theme preference
     */
    saveTheme(theme) {
        this.saveSetting('uiSettings.theme', theme);
    }
    /**
     * Get UI theme preference
     */
    getTheme() {
        return this.getSetting('uiSettings.theme', 'auto') || 'auto';
    }
    /**
     * Save debug console visibility
     */
    saveDebugConsoleVisibility(visible) {
        this.saveSetting('uiSettings.showDebugConsole', visible);
    }
    /**
     * Get debug console visibility
     */
    getDebugConsoleVisibility() {
        return this.getSetting('uiSettings.showDebugConsole', false) || false;
    }
    /**
     * Save audio settings
     */
    saveAudioSettings(settings) {
        const currentSettings = this.getSetting('audioSettings', {});
        const updatedSettings = { ...currentSettings, ...settings };
        this.saveSetting('audioSettings', updatedSettings);
    }
    /**
     * Get audio settings
     */
    getAudioSettings() {
        return this.getSetting('audioSettings', {
            vadSensitivity: 50,
            minSegmentDuration: 1000,
            maxSegmentDuration: 10000,
            quality: 'medium',
            noiseReduction: true,
            autoGainControl: true,
            echoCancellation: true
        });
    }
    /**
     * Save voice settings
     */
    saveVoiceSettings(settings) {
        const currentSettings = this.getSetting('voiceSettings', {});
        const updatedSettings = { ...currentSettings, ...settings };
        this.saveSetting('voiceSettings', updatedSettings);
    }
    /**
     * Get voice settings
     */
    getVoiceSettings() {
        return this.getSetting('voiceSettings', {
            stability: 0.5,
            similarityBoost: 0.5,
            speed: 1.0,
            quality: 'medium'
        });
    }
    /**
     * Export all settings to JSON
     */
    exportSettings() {
        const config = this.configManager.getConfig();
        const exportData = {
            version: this.settingsVersion,
            timestamp: new Date().toISOString(),
            settings: {
                selectedMicrophone: config.selectedMicrophone,
                targetLanguage: config.targetLanguage,
                sourceLanguage: config.sourceLanguage,
                translationProvider: config.translationProvider,
                voiceId: config.voiceId,
                debugMode: config.debugMode,
                audioSettings: config.audioSettings,
                voiceSettings: config.voiceSettings,
                uiSettings: {
                    theme: config.uiSettings.theme,
                    windowBounds: config.uiSettings.windowBounds,
                    showDebugConsole: config.uiSettings.showDebugConsole,
                    uiLanguage: config.uiSettings.uiLanguage,
                    showNotifications: config.uiSettings.showNotifications
                }
            }
        };
        return JSON.stringify(exportData, null, 2);
    }
    /**
     * Import settings from JSON
     */
    importSettings(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            if (!importData.settings) {
                throw new Error('Invalid settings format');
            }
            // Validate version compatibility
            if (importData.version && this.isVersionCompatible(importData.version)) {
                console.log(`Importing settings from version ${importData.version}`);
            }
            else {
                console.warn('Settings version may be incompatible, proceeding with caution');
            }
            // Import settings
            const settings = importData.settings;
            const updates = {};
            if (settings.selectedMicrophone !== undefined) {
                updates.selectedMicrophone = settings.selectedMicrophone;
            }
            if (settings.targetLanguage !== undefined) {
                updates.targetLanguage = settings.targetLanguage;
            }
            if (settings.sourceLanguage !== undefined) {
                updates.sourceLanguage = settings.sourceLanguage;
            }
            if (settings.translationProvider !== undefined) {
                updates.translationProvider = settings.translationProvider;
            }
            if (settings.voiceId !== undefined) {
                updates.voiceId = settings.voiceId;
            }
            if (settings.debugMode !== undefined) {
                updates.debugMode = settings.debugMode;
            }
            if (settings.audioSettings !== undefined) {
                updates.audioSettings = settings.audioSettings;
            }
            if (settings.voiceSettings !== undefined) {
                updates.voiceSettings = settings.voiceSettings;
            }
            if (settings.uiSettings !== undefined) {
                updates.uiSettings = settings.uiSettings;
            }
            // Apply updates
            this.configManager.updateConfig(updates);
            console.log('Settings imported successfully');
        }
        catch (error) {
            console.error('Error importing settings:', error);
            throw new Error(`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Reset all settings to defaults
     */
    resetAllSettings() {
        this.configManager.resetToDefaults();
        console.log('All settings reset to defaults');
    }
    /**
     * Get settings migration status
     */
    needsMigration() {
        const config = this.configManager.getConfig();
        // Check if this is an old configuration that needs migration
        return !config || typeof config !== 'object';
    }
    /**
     * Perform settings migration
     */
    migrateSettings() {
        if (!this.needsMigration()) {
            return;
        }
        console.log('Migrating settings to new format...');
        // For now, just reset to defaults
        // In the future, this could contain logic to migrate from older versions
        this.resetAllSettings();
        console.log('Settings migration completed');
    }
    /**
     * Check if a version is compatible with current settings format
     */
    isVersionCompatible(version) {
        // Simple version compatibility check
        const [major] = version.split('.').map(Number);
        const [currentMajor] = this.settingsVersion.split('.').map(Number);
        return major === currentMajor;
    }
    /**
     * Get settings summary for debugging
     */
    getSettingsSummary() {
        const config = this.configManager.getConfig();
        return {
            version: this.settingsVersion,
            configPath: this.configManager.getConfigPath(),
            hasOpenAIKey: !!(config.apiKeys.openai && config.apiKeys.openai.length > 0),
            hasElevenLabsKey: !!(config.apiKeys.elevenlabs && config.apiKeys.elevenlabs.length > 0),
            hasGoogleKey: !!(config.apiKeys.google && config.apiKeys.google.length > 0),
            hasDeepLKey: !!(config.apiKeys.deepl && config.apiKeys.deepl.length > 0),
            selectedMicrophone: config.selectedMicrophone || 'none',
            targetLanguage: config.targetLanguage,
            translationProvider: config.translationProvider,
            debugMode: config.debugMode,
            theme: config.uiSettings.theme
        };
    }
}
exports.SettingsManager = SettingsManager;
//# sourceMappingURL=SettingsManager.js.map