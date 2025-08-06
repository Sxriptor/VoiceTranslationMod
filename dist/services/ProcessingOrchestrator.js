"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingOrchestrator = void 0;
const TranslationServiceManager_1 = require("./TranslationServiceManager");
const TextToSpeechManager_1 = require("./TextToSpeechManager");
const VirtualMicrophoneManager_1 = require("./VirtualMicrophoneManager");
/**
 * Orchestrates the complete audio processing pipeline
 */
class ProcessingOrchestrator {
    constructor(configManager) {
        this.isProcessing = false;
        this.processingQueue = [];
        this.configManager = configManager;
        // Initialize services - simplified for MVP
        this.audioCapture = {}; // Placeholder
        this.speechToText = {}; // Placeholder
        this.translation = new TranslationServiceManager_1.TranslationServiceManager(configManager);
        this.textToSpeech = new TextToSpeechManager_1.TextToSpeechManager(configManager);
        this.virtualMicrophone = new VirtualMicrophoneManager_1.VirtualMicrophoneManager();
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
    async startProcessing() {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.updateState({ isActive: false, currentStep: 'error', error: errorMessage });
            throw error;
        }
    }
    /**
     * Stop the processing pipeline
     */
    async stopProcessing() {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.updateState({ isActive: false, currentStep: 'error', error: errorMessage });
        }
    }
    /**
     * Process a single audio segment through the complete pipeline
     */
    async processAudioSegment(audioData, timestamp) {
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
            const translationResult = await this.translation.translate(mockText, config.targetLanguage || 'es', 'en');
            const translationLatency = Date.now() - stepStartTime;
            stepStartTime = Date.now();
            // Step 3: Text-to-Speech
            this.updateState({ currentStep: 'synthesizing' });
            const voices = await this.textToSpeech.getAvailableVoices();
            const voiceId = voices[0]?.id || 'pNInz6obpgDQGcFmaJgB';
            const ttsResult = await this.textToSpeech.synthesize(translationResult.translatedText, voiceId);
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Processing pipeline error:', error);
            this.updateState({ currentStep: 'error', error: errorMessage });
        }
    }
    /**
     * Queue audio data for processing
     */
    queueAudioForProcessing(audioData) {
        const timestamp = Date.now();
        this.processingQueue.push({ audio: audioData, timestamp });
        // Process queue (simple FIFO for now)
        this.processQueue();
    }
    /**
     * Process queued audio segments
     */
    async processQueue() {
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
    async initializeServices() {
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
    async getSelectedMicrophone() {
        const config = await this.configManager.getConfiguration();
        return config.selectedMicrophone || 'default';
    }
    /**
     * Update processing state and notify listeners
     */
    updateState(updates) {
        this.currentState = { ...this.currentState, ...updates };
        if (this.onStateChange) {
            this.onStateChange(this.currentState);
        }
    }
    /**
     * Get current processing state
     */
    getState() {
        return { ...this.currentState };
    }
    /**
     * Set state change callback
     */
    setStateChangeCallback(callback) {
        this.onStateChange = callback;
    }
    /**
     * Test the complete pipeline with a sample
     */
    async testPipeline() {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.updateState({ currentStep: 'error', error: errorMessage });
            return false;
        }
    }
}
exports.ProcessingOrchestrator = ProcessingOrchestrator;
//# sourceMappingURL=ProcessingOrchestrator.js.map