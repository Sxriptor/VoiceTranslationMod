import { ConfigurationManager } from './ConfigurationManager';
export interface ProcessingState {
    isActive: boolean;
    currentStep: string;
    error: string | null;
    performance: {
        audioLatency: number;
        sttLatency: number;
        translationLatency: number;
        ttsLatency: number;
        totalLatency: number;
    };
}
/**
 * Orchestrates the complete audio processing pipeline
 */
export declare class ProcessingOrchestrator {
    private configManager;
    private audioCapture;
    private speechToText;
    private translation;
    private textToSpeech;
    private virtualMicrophone;
    private isProcessing;
    private currentState;
    private processingQueue;
    private onStateChange?;
    constructor(configManager: ConfigurationManager);
    /**
     * Start the real-time processing pipeline
     */
    startProcessing(): Promise<void>;
    /**
     * Stop the processing pipeline
     */
    stopProcessing(): Promise<void>;
    /**
     * Process a single audio segment through the complete pipeline
     */
    private processAudioSegment;
    /**
     * Queue audio data for processing
     */
    private queueAudioForProcessing;
    /**
     * Process queued audio segments
     */
    private processQueue;
    /**
     * Initialize all services
     */
    private initializeServices;
    /**
     * Get selected microphone device ID
     */
    private getSelectedMicrophone;
    /**
     * Update processing state and notify listeners
     */
    private updateState;
    /**
     * Get current processing state
     */
    getState(): ProcessingState;
    /**
     * Set state change callback
     */
    setStateChangeCallback(callback: (state: ProcessingState) => void): void;
    /**
     * Test the complete pipeline with a sample
     */
    testPipeline(): Promise<boolean>;
}
//# sourceMappingURL=ProcessingOrchestrator.d.ts.map