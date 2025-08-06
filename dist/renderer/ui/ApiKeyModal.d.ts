import { ApiKeys } from '../types/ConfigurationTypes';
/**
 * API Key Management Modal
 */
export declare class ApiKeyModal {
    private modal;
    private onSave?;
    /**
     * Show the API key management modal
     */
    show(currentKeys: ApiKeys, onSave: (apiKeys: Partial<ApiKeys>) => void): void;
    /**
     * Hide the modal
     */
    hide(): void;
    /**
     * Create the modal HTML structure
     */
    private createModal;
    /**
     * Add modal styles
     */
    private addModalStyles;
    /**
     * Attach event listeners to modal elements
     */
    private attachEventListeners;
    /**
     * Toggle password visibility for an input
     */
    private togglePasswordVisibility;
    /**
     * Validate an API key
     */
    private validateApiKey;
    /**
     * Handle save button click
     */
    private handleSave;
}
//# sourceMappingURL=ApiKeyModal.d.ts.map