/**
 * Manages user preferences and settings with automatic persistence
 */
export declare class SettingsManager {
    private static instance;
    private configManager;
    private settingsVersion;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): SettingsManager;
    /**
     * Save user preference
     */
    saveSetting<T>(key: string, value: T): void;
    /**
     * Get user preference
     */
    getSetting<T>(key: string, defaultValue?: T): T | undefined;
    /**
     * Save microphone selection
     */
    saveSelectedMicrophone(deviceId: string): void;
    /**
     * Get selected microphone
     */
    getSelectedMicrophone(): string;
    /**
     * Save target language
     */
    saveTargetLanguage(languageCode: string): void;
    /**
     * Get target language
     */
    getTargetLanguage(): string;
    /**
     * Save source language
     */
    saveSourceLanguage(languageCode: string): void;
    /**
     * Get source language
     */
    getSourceLanguage(): string;
    /**
     * Save translation provider preference
     */
    saveTranslationProvider(provider: string): void;
    /**
     * Get translation provider preference
     */
    getTranslationProvider(): string;
    /**
     * Save voice ID for TTS
     */
    saveVoiceId(voiceId: string): void;
    /**
     * Get voice ID for TTS
     */
    getVoiceId(): string;
    /**
     * Save debug mode preference
     */
    saveDebugMode(enabled: boolean): void;
    /**
     * Get debug mode preference
     */
    getDebugMode(): boolean;
    /**
     * Save window bounds
     */
    saveWindowBounds(bounds: {
        width: number;
        height: number;
        x?: number;
        y?: number;
        maximized: boolean;
    }): void;
    /**
     * Get window bounds
     */
    getWindowBounds(): {
        width: number;
        height: number;
        x?: number;
        y?: number;
        maximized: boolean;
    };
    /**
     * Save UI theme preference
     */
    saveTheme(theme: 'light' | 'dark' | 'auto'): void;
    /**
     * Get UI theme preference
     */
    getTheme(): 'light' | 'dark' | 'auto';
    /**
     * Save debug console visibility
     */
    saveDebugConsoleVisibility(visible: boolean): void;
    /**
     * Get debug console visibility
     */
    getDebugConsoleVisibility(): boolean;
    /**
     * Save audio settings
     */
    saveAudioSettings(settings: {
        vadSensitivity?: number;
        minSegmentDuration?: number;
        maxSegmentDuration?: number;
        quality?: string;
        noiseReduction?: boolean;
        autoGainControl?: boolean;
        echoCancellation?: boolean;
    }): void;
    /**
     * Get audio settings
     */
    getAudioSettings(): any;
    /**
     * Save voice settings
     */
    saveVoiceSettings(settings: {
        stability?: number;
        similarityBoost?: number;
        speed?: number;
        quality?: string;
    }): void;
    /**
     * Get voice settings
     */
    getVoiceSettings(): any;
    /**
     * Export all settings to JSON
     */
    exportSettings(): string;
    /**
     * Import settings from JSON
     */
    importSettings(jsonData: string): void;
    /**
     * Reset all settings to defaults
     */
    resetAllSettings(): void;
    /**
     * Get settings migration status
     */
    needsMigration(): boolean;
    /**
     * Perform settings migration
     */
    migrateSettings(): void;
    /**
     * Check if a version is compatible with current settings format
     */
    private isVersionCompatible;
    /**
     * Get settings summary for debugging
     */
    getSettingsSummary(): Record<string, any>;
}
//# sourceMappingURL=SettingsManager.d.ts.map