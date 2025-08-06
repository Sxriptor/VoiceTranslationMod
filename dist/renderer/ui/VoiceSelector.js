/**
 * Voice selector UI component for TTS voice selection
 */
export class VoiceSelector {
    constructor(selectElement) {
        this.voices = [];
        this.selectElement = selectElement;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.selectElement.addEventListener('change', () => {
            const selectedVoice = this.selectElement.value;
            if (this.onChangeCallback) {
                this.onChangeCallback(selectedVoice);
            }
        });
    }
    /**
     * Update the voice list
     */
    updateVoices(voices) {
        this.voices = voices;
        this.renderVoices();
    }
    renderVoices() {
        // Clear existing options
        this.selectElement.innerHTML = '<option value="">Select voice...</option>';
        // Add voice options
        this.voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.id;
            let displayName = voice.name;
            if (voice.isCloned) {
                displayName += ' (Cloned)';
            }
            if (voice.language) {
                displayName += ` - ${voice.language.toUpperCase()}`;
            }
            if (voice.gender) {
                displayName += ` (${voice.gender})`;
            }
            option.textContent = displayName;
            this.selectElement.appendChild(option);
        });
    }
    /**
     * Set callback for voice changes
     */
    onChange(callback) {
        this.onChangeCallback = callback;
    }
    /**
     * Get currently selected voice ID
     */
    getSelectedVoice() {
        return this.selectElement.value;
    }
    /**
     * Set selected voice
     */
    setSelectedVoice(voiceId) {
        this.selectElement.value = voiceId;
    }
    /**
     * Enable or disable the selector
     */
    setEnabled(enabled) {
        this.selectElement.disabled = !enabled;
    }
    /**
     * Show loading state
     */
    showLoading() {
        this.selectElement.innerHTML = '<option value="">Loading voices...</option>';
        this.selectElement.disabled = true;
    }
    /**
     * Show error state
     */
    showError(message) {
        this.selectElement.innerHTML = `<option value="">Error: ${message}</option>`;
        this.selectElement.disabled = true;
    }
}
//# sourceMappingURL=VoiceSelector.js.map