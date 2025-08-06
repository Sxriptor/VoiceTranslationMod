/**
 * Status indicator UI component for showing processing state
 */
export declare class StatusIndicator {
    private indicatorElement;
    private statusTextElement;
    constructor(indicatorElement: HTMLElement, statusTextElement: HTMLElement);
    /**
     * Update status with visual indicator
     */
    updateStatus(status: 'idle' | 'active' | 'error' | 'warning', text: string): void;
    /**
     * Show processing step
     */
    showProcessingStep(step: string): void;
    /**
     * Show error with message
     */
    showError(message: string): void;
    /**
     * Show idle state
     */
    showIdle(): void;
    /**
     * Show warning
     */
    showWarning(message: string): void;
    private getStepDisplayName;
    /**
     * Add pulsing animation
     */
    startPulsing(): void;
    /**
     * Stop pulsing animation
     */
    stopPulsing(): void;
}
//# sourceMappingURL=StatusIndicator.d.ts.map