/**
 * Status indicator UI component for showing processing state
 */
export class StatusIndicator {
    constructor(indicatorElement, statusTextElement) {
        this.indicatorElement = indicatorElement;
        this.statusTextElement = statusTextElement;
    }
    /**
     * Update status with visual indicator
     */
    updateStatus(status, text) {
        // Clear all status classes
        this.indicatorElement.classList.remove('idle', 'active', 'error', 'warning');
        // Add appropriate status class
        this.indicatorElement.classList.add(status);
        // Update status text
        this.statusTextElement.textContent = text;
    }
    /**
     * Show processing step
     */
    showProcessingStep(step) {
        this.updateStatus('active', this.getStepDisplayName(step));
    }
    /**
     * Show error with message
     */
    showError(message) {
        this.updateStatus('error', `Error: ${message}`);
    }
    /**
     * Show idle state
     */
    showIdle() {
        this.updateStatus('idle', 'Ready');
    }
    /**
     * Show warning
     */
    showWarning(message) {
        this.updateStatus('warning', message);
    }
    getStepDisplayName(step) {
        const stepNames = {
            'idle': 'Ready',
            'initializing': 'Initializing...',
            'listening': 'Listening',
            'transcribing': 'Converting speech to text...',
            'translating': 'Translating...',
            'synthesizing': 'Generating speech...',
            'outputting': 'Playing audio...',
            'stopping': 'Stopping...',
            'testing': 'Testing...',
            'error': 'Error'
        };
        return stepNames[step] || step;
    }
    /**
     * Add pulsing animation
     */
    startPulsing() {
        this.indicatorElement.classList.add('pulsing');
    }
    /**
     * Stop pulsing animation
     */
    stopPulsing() {
        this.indicatorElement.classList.remove('pulsing');
    }
}
//# sourceMappingURL=StatusIndicator.js.map