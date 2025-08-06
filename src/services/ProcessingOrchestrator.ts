import { AudioCaptureService } from '../interfaces/AudioCaptureService';
import { SpeechToTextService } from '../interfaces/SpeechToTextService';
import { TranslationService } from '../interfaces/TranslationService';
import { TextToSpeechService } from '../interfaces/TextToSpeechService';
import { VirtualMicrophoneService } from '../interfaces/VirtualMicrophoneService';
import { ConfigurationManager } from './ConfigurationManager';
import { AudioCaptureService as AudioCaptureManager } from './AudioCaptureService';
import { SpeechToTextService as SpeechToTextManager } from './SpeechToTextService';
import { TranslationServiceManager } from './TranslationServiceManager';
import { TextToSpeechManager } from './TextToSpeechManager';
import { VirtualMicrophoneManager } from './VirtualMicrophoneManager';

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
export class ProcessingOrchestrator {
    private configManager: ConfigurationManager;
    private audioCapture: AudioCaptureService;
    private speechToText: SpeechToTextService;
    private translation: TranslationService;
    private textToSpeech: TextToSpeechService;
    private virtualMicrophone: VirtualMicrophoneService;
    
    private isProcessing: boolean = false;
    private currentState: ProcessingState;
    private processingQueue: Array<{ audio: ArrayBuffer; timestamp: number }> = [];
    private onStateChange?: (state: ProcessingState) => void;

    constructor(configManager: ConfigurationManager) {
        this.configManager = configManager;
        
        // Initialize services - simplified for MVP
        this.audioCapture = {} as AudioCaptureService; // Placeholder
        this.speechToText = {} as SpeechToTextService; // Placeholder
        this.translation = new TranslationServiceManager(configManager);
        this.textToSpeech = new TextToSpeechManager(configManager);
        this.virtualMicrophone = new VirtualMicrophoneManager() as any;
        
        this.currentState = {
            isActive: false,
            currentStep: 'idle',
            error: null,
            performance: {
                audioLatency: 0,
                sttLatency: 0,
                translationLatency: 0,
                ttsLatency: 0,
                totalLatency: 0
            }
        };
    }

    /**
     * Start the real-time processing pipeline
     */
    async startProcessing(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        try {
            this.updateState({ isActive: true, currentStep: 'initializing', error: null });

            // Initialize all services
            await this.initializeServices();

            // Start audio capture (simplified for MVP)
            const deviceId = await this.getSelectedMicrophone();
            // Note: Audio capture implementation would be needed here
            console.log('Starting audio capture with device:', deviceId);

            this.isProcessing = true;
            this.updateState({ isActive: true, currentStep: 'listening', error: null });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.updateState({ isActive: false, currentStep: 'error', error: errorMessage });
            throw error;
        }
    }

    /**
     * Stop the processing pipeline
     */
    async stopProcessing(): Promise<void> {
        if (!this.isProcessing) {
            return;
        }

        try {
            this.updateState({ currentStep: 'stopping' });

            // Stop audio capture (simplified for MVP)
            console.log('Stopping audio capture');

            // Clear processing queue
            this.processingQueue = [];

            this.isProcessing = false;
            this.updateState({ 
                isActive: false, 
                currentStep: 'idle', 
                error: null,
                performance: {
                    audioLatency: 0,
                    sttLatency: 0,
                    translationLatency: 0,
                    ttsLatency: 0,
                    totalLatency: 0
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.updateState({ isActive: false, currentStep: 'error', error: errorMessage });
        }
    }

    /**
     * Process a single audio segment through the complete pipeline
     */
    private async processAudioSegment(audioData: ArrayBuffer, timestamp: number): Promise<void> {
        const startTime = Date.now();
        let stepStartTime = startTime;

        try {
            // Step 1: Speech-to-Text (simplified for MVP)
            this.updateState({ currentStep: 'transcribing' });
            // Mock transcription for now
            const mockText = "Hello, this is a test transcription";
            
            const sttLatency = Date.now() - stepStartTime;
            stepStartTime = Date.now();

            if (!mockText || mockText.trim().length === 0) {
                return;
            }

            // Step 2: Translation
            this.updateState({ currentStep: 'translating' });
            const config = await this.configManager.getConfiguration();
            const translationResult = await this.translation.translate(
                mockText,
                config.targetLanguage || 'es',
                'en'
            );

            const translationLatency = Date.now() - stepStartTime;
            stepStartTime = Date.now();

            // Step 3: Text-to-Speech
            this.updateState({ currentStep: 'synthesizing' });
            const voices = await this.textToSpeech.getAvailableVoices();
            const voiceId = voices[0]?.id || 'pNInz6obpgDQGcFmaJgB';
            
            const ttsResult = await this.textToSpeech.synthesize(
                translationResult.translatedText,
                voiceId
            );

            const ttsLatency = Date.now() - stepStartTime;
            stepStartTime = Date.now();

            // Step 4: Output to Virtual Microphone
            this.updateState({ currentStep: 'outputting' });
            await this.virtualMicrophone.sendAudio(ttsResult);

            const outputLatency = Date.now() - stepStartTime;
            const totalLatency = Date.now() - startTime;

            // Update performance metrics
            this.updateState({
                currentStep: 'listening',
                performance: {
                    audioLatency: timestamp - startTime,
                    sttLatency,
                    translationLatency,
                    ttsLatency,
                    totalLatency
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Processing pipeline error:', error);
            this.updateState({ currentStep: 'error', error: errorMessage });
        }
    }

    /**
     * Queue audio data for processing
     */
    private queueAudioForProcessing(audioData: ArrayBuffer): void {
        const timestamp = Date.now();
        this.processingQueue.push({ audio: audioData, timestamp });

        // Process queue (simple FIFO for now)
        this.processQueue();
    }

    /**
     * Process queued audio segments
     */
    private async processQueue(): Promise<void> {
        if (this.processingQueue.length === 0 || this.currentState.currentStep !== 'listening') {
            return;
        }

        const item = this.processingQueue.shift();
        if (item) {
            await this.processAudioSegment(item.audio, item.timestamp);
            
            // Continue processing queue
            if (this.processingQueue.length > 0) {
                setTimeout(() => this.processQueue(), 100);
            }
        }
    }

    /**
     * Initialize all services
     */
    private async initializeServices(): Promise<void> {
        const config = await this.configManager.getConfiguration();

        // Validate API keys
        if (!config.apiKeys.openai) {
            throw new Error('OpenAI API key is required');
        }
        if (!config.apiKeys.elevenlabs) {
            throw new Error('ElevenLabs API key is required');
        }

        // Initialize virtual microphone
        await this.virtualMicrophone.initialize();
        await this.virtualMicrophone.startStream();
    }

    /**
     * Get selected microphone device ID
     */
    private async getSelectedMicrophone(): Promise<string> {
        const config = await this.configManager.getConfiguration();
        return config.selectedMicrophone || 'default';
    }

    /**
     * Update processing state and notify listeners
     */
    private updateState(updates: Partial<ProcessingState>): void {
        this.currentState = { ...this.currentState, ...updates };
        
        if (this.onStateChange) {
            this.onStateChange(this.currentState);
        }
    }

    /**
     * Get current processing state
     */
    getState(): ProcessingState {
        return { ...this.currentState };
    }

    /**
     * Set state change callback
     */
    setStateChangeCallback(callback: (state: ProcessingState) => void): void {
        this.onStateChange = callback;
    }

    /**
     * Test the complete pipeline with a sample
     */
    async testPipeline(): Promise<boolean> {
        try {
            this.updateState({ currentStep: 'testing' });

            // Test each service individually (simplified for MVP)
            if (!this.translation.isAvailable()) {
                throw new Error('Translation service not available');
            }

            if (!this.textToSpeech.isAvailable()) {
                throw new Error('Text-to-speech service not available');
            }

            if (!this.virtualMicrophone.isAvailable()) {
                throw new Error('Virtual microphone not available');
            }

            // Test a simple translation
            const testResult = await this.translation.translate('Hello', 'es', 'en');
            if (!testResult.translatedText) {
                throw new Error('Translation test failed');
            }

            this.updateState({ currentStep: 'idle', error: null });
            return true;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.updateState({ currentStep: 'error', error: errorMessage });
            return false;
        }
    }
}