import { Voice } from '../interfaces/TextToSpeechService';
/**
 * Voice selector UI component for TTS voice selection
 */
export declare class VoiceSelector {
    private selectElement;
    private voices;
    private onChangeCallback?;
    constructor(selectElement: HTMLSelectElement);
    private setupEventListeners;
    /**
     * Update the voice list
     */
    updateVoices(voices: Voice[]): void;
    private renderVoices;
    /**
     * Set callback for voice changes
     */
    onChange(callback: (voiceId: string) => void): void;
    /**
     * Get currently selected voice ID
     */
    getSelectedVoice(): string;
    /**
     * Set selected voice
     */
    setSelectedVoice(voiceId: string): void;
    /**
     * Enable or disable the selector
     */
    setEnabled(enabled: boolean): void;
    /**
     * Show loading state
     */
    showLoading(): void;
    /**
     * Show error state
     */
    showError(message: string): void;
}
//# sourceMappingURL=VoiceSelector.d.ts.map