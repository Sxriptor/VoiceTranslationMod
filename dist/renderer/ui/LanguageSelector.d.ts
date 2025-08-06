/**
 * Language selector UI component
 */
export declare class LanguageSelector {
    private selectElement;
    private onChangeCallback?;
    constructor(selectElement: HTMLSelectElement);
    private initializeLanguages;
    private setupEventListeners;
    /**
     * Set callback for language changes
     */
    onChange(callback: (languageCode: string) => void): void;
    /**
     * Get currently selected language
     */
    getSelectedLanguage(): string;
    /**
     * Set selected language
     */
    setSelectedLanguage(languageCode: string): void;
    /**
     * Get language name from code
     */
    getLanguageName(code: string): string;
    /**
     * Enable or disable the selector
     */
    setEnabled(enabled: boolean): void;
}
//# sourceMappingURL=LanguageSelector.d.ts.map