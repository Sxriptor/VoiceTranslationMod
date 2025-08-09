// Renderer process entry point
console.log('Renderer process starting...');

// DOM elements
const startButton = document.getElementById('start-button') as HTMLButtonElement;
const testButton = document.getElementById('test-button') as HTMLButtonElement;
const addVoiceButton = document.getElementById('add-voice-button') as HTMLButtonElement;
const hearYourselfButton = document.getElementById('hear-yourself-button') as HTMLButtonElement;
const virtualMicTestButton = document.getElementById('virtual-mic-test-button') as HTMLButtonElement;
const outputToggleButton = document.getElementById('output-toggle-button') as HTMLButtonElement;
const settingsButton = document.getElementById('settings-button') as HTMLButtonElement;
const refreshButton = document.getElementById('refresh-button') as HTMLButtonElement;

// Live translation elements
const liveTranslationPanel = document.getElementById('live-translation-panel') as HTMLDivElement;
const currentKeybindSpan = document.getElementById('current-keybind') as HTMLSpanElement;
const changeKeybindBtn = document.getElementById('change-keybind-btn') as HTMLButtonElement;
const recordingIndicator = document.getElementById('recording-indicator') as HTMLDivElement;
const recordingText = document.getElementById('recording-text') as HTMLSpanElement;
const originalTextDiv = document.getElementById('original-text') as HTMLDivElement;
const translatedTextDiv = document.getElementById('translated-text') as HTMLDivElement;
const microphoneSelect = document.getElementById('microphone-select') as HTMLSelectElement;
const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
const debugToggle = document.getElementById('debug-toggle') as HTMLButtonElement;
const debugConsole = document.getElementById('debug-console') as HTMLDivElement;
const debugOutput = document.getElementById('debug-output') as HTMLDivElement;
const connectionStatus = document.getElementById('connection-status') as HTMLSpanElement;
const processingStatus = document.getElementById('processing-status') as HTMLSpanElement;
const statusIndicator = document.getElementById('status-indicator') as HTMLElement;
// Sidebar elements
const sidebarToggleButton = document.getElementById('sidebar-toggle') as HTMLButtonElement | null;
const appSidebar = document.getElementById('app-sidebar') as HTMLDivElement | null;
const sidebarSettingsButton = document.getElementById('sidebar-settings-button') as HTMLButtonElement | null;
const sidebarLogsButton = document.getElementById('sidebar-logs-button') as HTMLButtonElement | null;
const sidebarAboutButton = document.getElementById('sidebar-about-button') as HTMLButtonElement | null;
const sidebarTranslateButton = document.getElementById('sidebar-translate-button') as HTMLButtonElement | null;
const sidebarBidirectionalButton = document.getElementById('sidebar-bidirectional-button') as HTMLButtonElement | null;

// Pages
const translatePage = document.getElementById('translate-page') as HTMLDivElement | null;
const bidirectionalPanel = document.getElementById('bidirectional-panel') as HTMLDivElement | null;

// Bidirectional elements
const bidirectionalToggleButton = document.getElementById('bidirectional-toggle-button') as HTMLButtonElement | null;
const bidirectionalStatusIndicator = document.getElementById('bidirectional-status-indicator') as HTMLElement | null;
const bidirectionalKeybindSpan = document.getElementById('bidirectional-current-keybind') as HTMLSpanElement | null;
const bidirectionalChangeKeybindBtn = document.getElementById('bidirectional-change-keybind-btn') as HTMLButtonElement | null;
const bidirectionalOutputSelect = document.getElementById('bidirectional-output-select') as HTMLSelectElement | null;
const incomingVoiceSelect = document.getElementById('incoming-voice-select') as HTMLSelectElement | null;
const bidirectionalRecordingDot = document.getElementById('bidirectional-recording-dot') as HTMLElement | null;
const bidirectionalStatusText = document.getElementById('bidirectional-status') as HTMLSpanElement | null;
const bidirectionalDetectedText = document.getElementById('bidirectional-detected-text') as HTMLDivElement | null;
const bidirectionalRespokenText = document.getElementById('bidirectional-respoken-text') as HTMLDivElement | null;

// Application state
let isTranslating = false;
let isDebugVisible = false;
let isRecording = false;
let currentKeybind = 'Space';
let mediaRecorder: MediaRecorder | null = null;
let audioStream: MediaStream | null = null;
let audioChunks: Blob[] = [];
let isProcessingAudio = false; // Prevent concurrent audio processing
let virtualOutputDeviceId: string | null = null; // AudioOutput sink for VB-CABLE
let passThroughAudioEl: HTMLAudioElement | null = null; // Mic → VB-CABLE passthrough
let outputToVirtualDevice = true; // user toggle for routing output

// Bidirectional state
let isBidirectionalActive = false;
let bidirectionalKeybind = 'KeyB';
let bidirectionalOutputDeviceId: string | null = null;
let incomingVoiceId: string | null = null;
let bidiAudioStream: MediaStream | null = null;
let bidiRecorder: MediaRecorder | null = null;
let bidiAnalyzerCtx: AudioContext | null = null;
let bidiAnalyzerNode: AnalyserNode | null = null;
let bidiSourceNode: MediaStreamAudioSourceNode | null = null;
let bidiVadInterval: number | null = null;
let bidiInSpeech = false;
let bidiProcessing = false;
let bidiCurrentBlobs: Blob[] = [];
let bidiFirstTargetIndex = -1;
let bidiSectionActive = false;
let bidiMimeType = 'audio/webm;codecs=opus';
let bidiNeedsProbe = false;
let bidiSectionBlocked = false;
let bidiLastVoiceTs = 0;
let pendingFinalize = false;

// Global error handlers
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    logToDebug(`❌ Global error: ${event.error?.message || 'Unknown error'}`);
    logToDebug(`   File: ${event.filename}:${event.lineno}:${event.colno}`);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    logToDebug(`❌ Unhandled promise rejection: ${event.reason}`);
    event.preventDefault(); // Prevent the default behavior (logging to console)
});

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing application...');
    
    try {
        initializeEventListeners();
        await loadMicrophoneDevices();
        await detectVirtualOutputDevice();
        await initializeLanguageSelector();
        await initializeBidirectionalTab();
        await checkApiKeysConfiguration();
        setupRealTimeAudioPlayback();
        setupTestAudioPlayback();
        setupRealTimeTranslationAudio();
        setupClearAudioCapture();
        await restoreOutputPreference();
        await restoreSidebarPreference();
        
        logToDebug('Application initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        logToDebug(`Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});

// Set up real-time audio playback listener
function setupRealTimeAudioPlayback(): void {
    // Keep listener available but do nothing to avoid duplicate playback
    (window as any).electronAPI.setupRealTimeAudioPlayback(() => {});
}

// Set up test audio playback listener
function setupTestAudioPlayback(): void {
    // No-op: we now play test audio from invoke response to avoid double-playback
}

// Set up real-time translation audio playback listener
function setupRealTimeTranslationAudio(): void {
    (window as any).electronAPI.setupRealTimeTranslationAudio((data: any) => {
        try {
            const { audioData, originalText, translatedText, outputToVirtualMic, isRealTime } = data;
            
            logToDebug(`🔄 Real-time translation: "${originalText}" → "${translatedText}"`);
            
            // Update UI with the translation
            if (originalTextDiv && translatedTextDiv) {
                originalTextDiv.textContent = originalText;
                originalTextDiv.classList.remove('processing', 'empty');
                
                translatedTextDiv.textContent = translatedText;
                translatedTextDiv.classList.remove('empty');
            }
            // If Bidirectional tab is active, mirror content there when applicable
            if (bidirectionalDetectedText && bidirectionalRespokenText && isBidirectionalActive) {
                bidirectionalDetectedText.textContent = originalText;
                bidirectionalDetectedText.classList.remove('empty');
                bidirectionalRespokenText.textContent = translatedText;
                bidirectionalRespokenText.classList.remove('empty');
            }
            
            // Play the translated audio
            playRealTimeTranslationAudio(audioData, outputToVirtualMic);
            
        } catch (error) {
            console.error('Error handling real-time translation audio:', error);
            logToDebug(`❌ Real-time translation audio error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
}

// Set up clear audio capture listener
function setupClearAudioCapture(): void {
    (window as any).electronAPI.setupClearAudioCapture(async (data: any) => {
        try {
            const { reason } = data;
            logToDebug(`🧹 Clearing audio capture - reason: ${reason}`);
            
            // Clear the audio chunks to prevent re-processing
            audioChunks = [];
            
            // Reset processing flag
            isProcessingAudio = false;
            
            // Stop and restart the MediaRecorder to prevent corrupted audio
            if (mediaRecorder && isTranslating) {
                logToDebug('🔄 Restarting MediaRecorder to prevent audio corruption');
                try {
                    // Stop the current recorder
                    if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
                        mediaRecorder.stop();
                    }
                    
                    // Wait a moment for it to fully stop
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Restart the recorder with fresh audio stream
                    await restartRealTimeAudioCapture();
                    
                } catch (restartError) {
                    console.error('Failed to restart MediaRecorder:', restartError);
                    logToDebug(`❌ MediaRecorder restart failed: ${restartError instanceof Error ? restartError.message : 'Unknown error'}`);
                }
            }
            
            // Clear UI text after a short delay to let user see the result
            setTimeout(() => {
                if (originalTextDiv && translatedTextDiv) {
                    originalTextDiv.textContent = '';
                    originalTextDiv.classList.add('empty');
                    translatedTextDiv.textContent = '';
                    translatedTextDiv.classList.add('empty');
                }
                
                if (recordingText) {
                    recordingText.textContent = 'Listening continuously...';
                }
                
                logToDebug('🧹 UI cleared after translation');
            }, 2000); // Show result for 2 seconds before clearing
            
        } catch (error) {
            console.error('Error handling clear audio capture:', error);
            logToDebug(`❌ Clear audio capture error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
}

// Play test translated audio
async function playTestAudio(audioData: number[], outputToHeadphones: boolean): Promise<void> {
    try {
        // Convert array back to ArrayBuffer
        const audioBuffer = new Uint8Array(audioData).buffer;
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        
        // Create audio element and play
        const audio = new Audio();
        const url = URL.createObjectURL(audioBlob);
        
        audio.onended = () => {
            URL.revokeObjectURL(url);
        };
        
        audio.onerror = (error) => {
            URL.revokeObjectURL(url);
            console.error('Test audio playback error:', error);
        };
        
        audio.src = url;
        audio.volume = outputToHeadphones ? 1.0 : 0.7;
        if (!outputToHeadphones && outputToVirtualDevice && virtualOutputDeviceId && 'setSinkId' in audio) {
            try {
                await (audio as any).setSinkId(virtualOutputDeviceId);
                logToDebug(`🔌 Routed test audio to virtual output: ${virtualOutputDeviceId}`);
            } catch (e) {
                logToDebug('⚠️ Failed to route test audio to virtual output, using default output');
            }
        }
        
        await audio.play();
        
        logToDebug(`🔊 Test audio played successfully (headphones: ${outputToHeadphones})`);
        
    } catch (error) {
        console.error('Failed to play test audio:', error);
        logToDebug(`❌ Test audio playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Play real-time translated audio
async function playRealTimeAudio(audioData: number[], outputToVirtualMic: boolean): Promise<void> {
    try {
        // Convert array back to ArrayBuffer
        const audioBuffer = new Uint8Array(audioData).buffer;
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        
        // Create audio element and play
        const audio = new Audio();
        const url = URL.createObjectURL(audioBlob);
        
        audio.onended = () => {
            URL.revokeObjectURL(url);
        };
        
        audio.onerror = (error) => {
            URL.revokeObjectURL(url);
            console.error('Audio playback error:', error);
        };
        
        audio.src = url;
        
        if (outputToVirtualMic && outputToVirtualDevice) {
            // For virtual microphone mode, play at lower volume
            audio.volume = 0.7;
            if (virtualOutputDeviceId && 'setSinkId' in audio) {
                try {
                    await (audio as any).setSinkId(virtualOutputDeviceId);
                    logToDebug(`🔌 Routed real-time audio to virtual output: ${virtualOutputDeviceId}`);
                } catch (e) {
                    logToDebug('⚠️ Failed to route real-time audio to virtual output, using default output');
                }
            }
            logToDebug('🎤 Playing translated audio (virtual microphone mode)');
        } else {
            // For headphone mode, play at normal volume
            audio.volume = 1.0;
            logToDebug('🔊 Playing translated audio (headphone mode)');
        }
        
        await audio.play();
        
    } catch (error) {
        console.error('Failed to play real-time audio:', error);
        logToDebug(`❌ Audio playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Play real-time translation audio with feedback prevention
async function playRealTimeTranslationAudio(audioData: number[], outputToVirtualMic: boolean): Promise<void> {
    try {
        // Temporarily pause audio capture to prevent feedback
        const wasCapturing = mediaRecorder && mediaRecorder.state === 'recording' && isTranslating;
        if (wasCapturing) {
            logToDebug('⏸️ Temporarily pausing audio capture to prevent feedback');
            try {
                mediaRecorder!.pause();
            } catch (pauseError) {
                console.warn('⚠️ Failed to pause MediaRecorder:', pauseError);
            }
        }
        
        // Convert array back to ArrayBuffer
        const audioBuffer = new Uint8Array(audioData).buffer;
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        
        // Create audio element and play
        const audio = new Audio();
        const url = URL.createObjectURL(audioBlob);
        
        audio.onended = () => {
            URL.revokeObjectURL(url);
            // Resume audio capture after playback ends
            if (wasCapturing && mediaRecorder && mediaRecorder.state === 'paused' && isTranslating) {
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'paused' && isTranslating) {
                        logToDebug('▶️ Resuming audio capture after playback');
                        try {
                            mediaRecorder.resume();
                        } catch (resumeError) {
                            console.warn('⚠️ Failed to resume MediaRecorder:', resumeError);
                        }
                    }
                }, 500); // Small delay to ensure audio has finished
            }
        };
        
        audio.onerror = (error) => {
            URL.revokeObjectURL(url);
            console.error('Real-time audio playback error:', error);
            // Resume capture even on error
            if (wasCapturing && mediaRecorder && mediaRecorder.state === 'paused' && isTranslating) {
                try {
                    mediaRecorder.resume();
                } catch (resumeError) {
                    console.warn('⚠️ Failed to resume MediaRecorder after error:', resumeError);
                }
            }
        };
        
        audio.src = url;
        
        if (outputToVirtualMic && outputToVirtualDevice) {
            // For virtual microphone mode, play at lower volume
            audio.volume = 0.7;
            if (virtualOutputDeviceId && 'setSinkId' in audio) {
                try {
                    await (audio as any).setSinkId(virtualOutputDeviceId);
                    logToDebug(`🔌 Routed real-time translation audio to virtual output: ${virtualOutputDeviceId}`);
                } catch (e) {
                    logToDebug('⚠️ Failed to route real-time translation audio to virtual output, using default output');
                }
            }
            logToDebug('🎤 Playing real-time translated audio (virtual microphone mode)');
        } else {
            // For headphone mode, play at normal volume
            audio.volume = 1.0;
            logToDebug('🔊 Playing real-time translated audio (headphone mode)');
        }
        
        await audio.play();
        
    } catch (error) {
        console.error('Failed to play real-time translation audio:', error);
        logToDebug(`❌ Real-time translation audio playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Resume capture on error
        if (mediaRecorder && mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
    }
}

function initializeEventListeners(): void {
    // Start/Stop button
    startButton.addEventListener('click', toggleTranslation);
    
    // Test button
    testButton.addEventListener('click', testTranslation);
    
    // Add voice button
    addVoiceButton.addEventListener('click', showAddVoiceModal);
    
    // Hear yourself button
    hearYourselfButton.addEventListener('click', testHearYourself);
    
    // Virtual mic test button
    virtualMicTestButton.addEventListener('click', testVirtualMicrophone);
    // Output toggle button
    outputToggleButton.addEventListener('click', toggleOutputTarget);
    
    // Settings button
    settingsButton.addEventListener('click', openSettings);
    
    // Refresh button
    refreshButton.addEventListener('click', refreshDevicesAndVoices);
    
    // Debug toggle
    debugToggle.addEventListener('click', toggleDebugConsole);
    
    // Sidebar controls
    if (sidebarToggleButton && appSidebar) {
        sidebarToggleButton.addEventListener('click', toggleSidebar);
    }
    if (sidebarSettingsButton) {
        sidebarSettingsButton.addEventListener('click', openSettings);
    }
    if (sidebarLogsButton) {
        sidebarLogsButton.addEventListener('click', toggleDebugConsole);
    }
    if (sidebarAboutButton) {
        sidebarAboutButton.addEventListener('click', () => {
            alert('Real-Time Voice Translator\nBlack & White UI');
        });
    }
    if (sidebarTranslateButton) {
        sidebarTranslateButton.addEventListener('click', () => switchTab('translate'));
    }
    if (sidebarBidirectionalButton) {
        sidebarBidirectionalButton.addEventListener('click', () => switchTab('bidirectional'));
    }

    // Device selection
    microphoneSelect.addEventListener('change', onMicrophoneChange);
    
    // Language selection
    languageSelect.addEventListener('change', onLanguageChange);
    
    // Voice selection
    voiceSelect.addEventListener('change', onVoiceChange);
    
    // Live translation controls
    changeKeybindBtn.addEventListener('click', showKeybindModal);
    
    // Keyboard event listeners for push-to-talk
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', handleBidirectionalKeyDown);

    // Bidirectional listeners
    if (bidirectionalToggleButton) bidirectionalToggleButton.addEventListener('click', toggleBidirectional);
    if (bidirectionalChangeKeybindBtn) bidirectionalChangeKeybindBtn.addEventListener('click', showBidirectionalKeybindModal);
    if (bidirectionalOutputSelect) bidirectionalOutputSelect.addEventListener('change', onBidirectionalOutputChange);
    if (incomingVoiceSelect) incomingVoiceSelect.addEventListener('change', onIncomingVoiceChange);
}

async function toggleTranslation(): Promise<void> {
    try {
        if (isTranslating) {
            // Stop push-to-talk mode
            startButton.disabled = true;
            startButton.textContent = '⏹️ Stopping...';
            
            isTranslating = false;
            startButton.textContent = '▶️ Start Translation';
            startButton.classList.remove('active');
            startButton.disabled = false;
            processingStatus.textContent = 'Idle';
            logToDebug('Push-to-talk mode stopped');
            
            // Hide live translation panel
            liveTranslationPanel.style.display = 'none';
            
            // Clean up audio stream
            await cleanupAudioStream();
        } else {
            // Validate configuration before starting
            if (!microphoneSelect.value) {
                throw new Error('Please select a microphone device');
            }
            if (!languageSelect.value) {
                throw new Error('Please select a target language');
            }
            if (!voiceSelect.value) {
                throw new Error('Please select a voice');
            }
            
            // Start push-to-talk mode (no need for pipeline:start)
            startButton.disabled = true;
            startButton.textContent = '▶️ Starting...';
            
            // Just initialize audio stream for push-to-talk - no real-time orchestrator needed
            await initializeAudioStream();
            await startPassThrough();
            
            isTranslating = true;
            startButton.textContent = '⏹️ Stop Translation';
            startButton.classList.add('active');
            startButton.disabled = false;
            processingStatus.textContent = 'Push-to-Talk Ready';
            logToDebug('Push-to-talk mode started - hold spacebar to record');
            
            // Show live translation panel
            liveTranslationPanel.style.display = 'block';
        }
        
        updateStatusIndicator();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`Translation toggle error: ${errorMessage}`);
        
        // Reset button state on error
        isTranslating = false;
        startButton.textContent = '▶️ Start Translation';
        startButton.classList.remove('active');
        startButton.disabled = false;
        processingStatus.textContent = `Error: ${errorMessage}`;
        updateStatusIndicator('error');
    }
}

async function testTranslation(): Promise<void> {
    try {
        testButton.disabled = true;
        testButton.textContent = '🧪 Testing...';
        
        logToDebug('Testing translation pipeline...');
        
        // Test the complete translation pipeline
        const response = await (window as any).electronAPI.invoke('pipeline:test', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: {
                text: 'Hello, this is a test of the translation system.',
                targetLanguage: languageSelect.value || 'es',
                voiceId: voiceSelect.value || 'pNInz6obpgDQGcFmaJgB',
                outputToHeadphones: true // Test mode outputs to headphones
            }
        });

        if (response.success) {
            logToDebug('✅ Translation test completed successfully');
            logToDebug(`Original: ${response.payload.originalText}`);
            logToDebug(`Translated: ${response.payload.translatedText}`);
            
            // Play the audio locally from the response to avoid event-based duplication
            if (response.payload.audioGenerated && response.payload.audioBuffer) {
                try {
                    logToDebug('🔊 Playing translated audio in renderer process...');
                    logToDebug(`📊 Audio buffer size: ${response.payload.audioBuffer.length} bytes`);
                    await playAudioInRenderer(response.payload.audioBuffer);
                    logToDebug('✅ Audio played successfully to headphones');
                } catch (audioError) {
                    const errorMsg = audioError instanceof Error ? audioError.message : 'Unknown error';
                    logToDebug(`⚠️ Audio playback failed: ${errorMsg}`);
                    console.error('Audio playback error details:', audioError);
                }
            } else {
                logToDebug(`ℹ️ Audio status - Generated: ${response.payload.audioGenerated}, Buffer: ${response.payload.audioBuffer ? 'present' : 'missing'}`);
            }
            
            processingStatus.textContent = 'Test passed';
        } else {
            throw new Error(response.error || 'Translation test failed');
        }
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ Test failed: ${errorMessage}`);
        processingStatus.textContent = `Test error: ${errorMessage}`;
    } finally {
        testButton.disabled = false;
        testButton.textContent = '🧪 Test Translation';
    }
}

async function openSettings(): Promise<void> {
    logToDebug('Opening settings...');
    
    try {
        // Get current configuration
        const response = await (window as any).electronAPI.invoke('config:get', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: null
        });

        if (response.success) {
            const config = response.payload;
            showApiKeyModal(config.apiKeys);
        } else {
            logToDebug('Error loading configuration for settings');
        }
    } catch (error) {
        logToDebug(`Error opening settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function showApiKeyModal(apiKeys: any): void {
    // Create a simple modal for API keys
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        width: 400px;
        max-width: 90%;
    `;
    
    modalContent.innerHTML = `
        <h2>API Configuration</h2>
        <div style="margin-bottom: 1rem;">
            <label for="openai-key">OpenAI API Key:</label>
            <input type="password" id="openai-key" value="${apiKeys.openai || ''}" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
        </div>
        <div style="margin-bottom: 1rem;">
            <label for="elevenlabs-key">ElevenLabs API Key:</label>
            <input type="password" id="elevenlabs-key" value="${apiKeys.elevenlabs || ''}" style="width: 100%; padding: 0.5rem; margin-top: 0.25rem;">
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="cancel-btn" style="padding: 0.5rem 1rem;">Cancel</button>
            <button id="save-btn" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px;">Save</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Handle save
    modalContent.querySelector('#save-btn')?.addEventListener('click', async () => {
        const openaiKey = (modalContent.querySelector('#openai-key') as HTMLInputElement).value;
        const elevenlabsKey = (modalContent.querySelector('#elevenlabs-key') as HTMLInputElement).value;
        
        await updateApiKeys({
            openai: openaiKey,
            elevenlabs: elevenlabsKey
        });
        
        document.body.removeChild(modal);
    });
    
    // Handle cancel
    modalContent.querySelector('#cancel-btn')?.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Handle click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

async function toggleDebugConsole(): Promise<void> {
    isDebugVisible = !isDebugVisible;
    
    if (isDebugVisible) {
        debugConsole.classList.add('visible');
        debugToggle.textContent = 'Hide Debug Console';
    } else {
        debugConsole.classList.remove('visible');
        debugToggle.textContent = 'Show Debug Console';
    }
    
    // Save the preference
    try {
        await (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: { 
                uiSettings: { 
                    showDebugConsole: isDebugVisible 
                } 
            }
        });
    } catch (error) {
        logToDebug(`Error saving debug console preference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Sidebar state persistence
async function restoreSidebarPreference(): Promise<void> {
    try {
        const response = await (window as any).electronAPI.invoke('config:get', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: null
        });
        if (response.success && response.payload?.uiSettings?.sidebarCollapsed !== undefined) {
            const collapsed = !!response.payload.uiSettings.sidebarCollapsed;
            setSidebarCollapsed(collapsed);
        }
    } catch {
        // ignore
    }
}

function setSidebarCollapsed(collapsed: boolean): void {
    if (!appSidebar) return;
    if (collapsed) {
        appSidebar.classList.add('collapsed');
    } else {
        appSidebar.classList.remove('collapsed');
    }
}

async function toggleSidebar(): Promise<void> {
    if (!appSidebar) return;
    const collapsed = !appSidebar.classList.contains('collapsed');
    setSidebarCollapsed(collapsed);
    try {
        await (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: { uiSettings: { sidebarCollapsed: collapsed } }
        });
    } catch {}
}

function switchTab(tab: 'translate' | 'bidirectional'): void {
    if (!translatePage || !bidirectionalPanel) return;
    if (tab === 'translate') {
        translatePage.style.display = '';
        bidirectionalPanel.style.display = 'none';
    } else {
        translatePage.style.display = 'none';
        bidirectionalPanel.style.display = '';
    }
}

async function initializeBidirectionalTab(): Promise<void> {
    try {
        // Load output devices
        await loadBidirectionalOutputDevices();
        // Load incoming voices
        await loadIncomingVoices();
        // Restore saved settings
        const response = await (window as any).electronAPI.invoke('config:get', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: null
        });
        if (response.success) {
            const cfg = response.payload;
            if (cfg.uiSettings?.bidirectionalKeybind) {
                bidirectionalKeybind = cfg.uiSettings.bidirectionalKeybind;
                if (bidirectionalKeybindSpan) bidirectionalKeybindSpan.textContent = bidirectionalKeybind;
            }
            if (cfg.uiSettings?.bidirectionalOutputDeviceId && bidirectionalOutputSelect) {
                bidirectionalOutputDeviceId = cfg.uiSettings.bidirectionalOutputDeviceId;
                bidirectionalOutputSelect.value = bidirectionalOutputDeviceId || '';
            }
            if (cfg.uiSettings?.incomingVoiceId && incomingVoiceSelect) {
                incomingVoiceId = cfg.uiSettings.incomingVoiceId;
                incomingVoiceSelect.value = incomingVoiceId || '';
            }
        }
    } catch {}
}

async function loadBidirectionalOutputDevices(): Promise<void> {
    if (!bidirectionalOutputSelect) return;
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        bidirectionalOutputSelect.innerHTML = '';
        outputs.forEach((d) => {
            const opt = document.createElement('option');
            opt.value = d.deviceId;
            opt.textContent = d.label || 'Output Device';
            bidirectionalOutputSelect.appendChild(opt);
        });
        if (outputs.length > 0 && !bidirectionalOutputDeviceId) {
            bidirectionalOutputDeviceId = outputs[0].deviceId;
            bidirectionalOutputSelect.value = bidirectionalOutputDeviceId || '';
        }
    } catch {}
}

async function loadIncomingVoices(): Promise<void> {
    if (!incomingVoiceSelect) return;
    try {
        incomingVoiceSelect.innerHTML = '<option value="">Loading voices...</option>';
        const response = await (window as any).electronAPI.invoke('voice:get-voices', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: null
        });
        let voices: any[] = [];
        if (response.success && response.payload) {
            voices = response.payload;
        } else {
            voices = [
                { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Male, English)' },
                { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Female, English)' }
            ];
        }
        incomingVoiceSelect.innerHTML = '';
        voices.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.name;
            incomingVoiceSelect.appendChild(opt);
        });
        if (!incomingVoiceId && voices.length > 0) {
            incomingVoiceId = voices[0].id;
            incomingVoiceSelect.value = incomingVoiceId || '';
        }
    } catch {}
}

async function onBidirectionalOutputChange(): Promise<void> {
    if (!bidirectionalOutputSelect) return;
    bidirectionalOutputDeviceId = bidirectionalOutputSelect.value || null;
    try {
        await (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: { uiSettings: { bidirectionalOutputDeviceId } }
        });
    } catch {}
}

async function onIncomingVoiceChange(): Promise<void> {
    if (!incomingVoiceSelect) return;
    incomingVoiceId = incomingVoiceSelect.value || null;
    try {
        await (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: { uiSettings: { incomingVoiceId } }
        });
    } catch {}
}

function setBidirectionalStatus(active: boolean): void {
    if (bidirectionalStatusIndicator) {
        bidirectionalStatusIndicator.classList.toggle('active', active);
    }
    if (bidirectionalRecordingDot) {
        bidirectionalRecordingDot.classList.toggle('active', active);
    }
    if (bidirectionalStatusText) {
        bidirectionalStatusText.textContent = active ? 'Listening...' : 'Idle';
    }
    if (bidirectionalToggleButton) {
        bidirectionalToggleButton.textContent = active ? '⏹️ Stop Bidirectional' : 'Start Bidirectional';
        if (!active) bidirectionalToggleButton.classList.remove('active');
        else bidirectionalToggleButton.classList.add('active');
    }
}

function handleBidirectionalKeyDown(event: KeyboardEvent): void {
    if (!bidirectionalPanel || bidirectionalPanel.style.display === 'none') return;
    if (event.code === bidirectionalKeybind) {
        event.preventDefault();
        toggleBidirectional();
    }
}

function showBidirectionalKeybindModal(): void {
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.5); display:flex;align-items:center;justify-content:center; z-index:1000;`;
    const content = document.createElement('div');
    content.style.cssText = 'background:white;padding:1.5rem;border-radius:8px;max-width:90%;width:380px;text-align:center;';
    content.innerHTML = `
        <h3>Change Bidirectional Toggle Key</h3>
        <p>Press any key to set it as the toggle</p>
        <div style="margin:1rem 0;">Current: <kbd>${bidirectionalKeybind}</kbd></div>
        <button id="bidi-cancel" style="padding:0.5rem 1rem;">Cancel</button>
    `;
    modal.appendChild(content);
    document.body.appendChild(modal);
    let set = false;
    const listener = (e: KeyboardEvent) => {
        if (set) return;
        set = true;
        bidirectionalKeybind = e.code;
        if (bidirectionalKeybindSpan) bidirectionalKeybindSpan.textContent = bidirectionalKeybind;
        (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(), timestamp: Date.now(), payload: { uiSettings: { bidirectionalKeybind } }
        }).catch(() => {});
        document.removeEventListener('keydown', listener);
        document.body.removeChild(modal);
    };
    document.addEventListener('keydown', listener);
    content.querySelector('#bidi-cancel')?.addEventListener('click', () => {
        document.removeEventListener('keydown', listener);
        document.body.removeChild(modal);
    });
}

async function toggleBidirectional(): Promise<void> {
    try {
        if (isBidirectionalActive) {
            await stopBidirectional();
        } else {
            await startBidirectional();
        }
    } catch (e) {
        logToDebug(`❌ Bidirectional toggle error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}

async function startBidirectional(): Promise<void> {
    if (isBidirectionalActive) return;
    // Ensure mic device
    if (!microphoneSelect.value) {
        alert('Please select a microphone');
        return;
    }
    // Ensure voice
    if (!incomingVoiceId && incomingVoiceSelect && incomingVoiceSelect.value) {
        incomingVoiceId = incomingVoiceSelect.value;
    }
    if (!incomingVoiceId) {
        alert('Please select an incoming voice');
        return;
    }
    // Start capture - use desktop audio to capture system output instead of microphone
    try {
        // Try desktop audio capture first (captures system audio output)
        bidiAudioStream = await (navigator.mediaDevices as any).getDisplayMedia({
            video: false,
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                sampleRate: 44100,
                channelCount: 2
            }
        });
        console.log('✅ Using desktop audio capture for system output');
    } catch (e) {
        console.warn('⚠️ Desktop audio failed, falling back to microphone:', e);
        // Fallback to microphone if desktop audio not available
        bidiAudioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: microphoneSelect.value,
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        console.log('⚠️ Using microphone input as fallback');
    }
    if (!bidiAudioStream) {
        throw new Error('Failed to get audio stream for Bidirectional');
    }
    
    // TypeScript assertion - we know bidiAudioStream is not null at this point
    const audioStream = bidiAudioStream as MediaStream;
    
    logToDebug('🔁 Starting Bidirectional: initializing audio capture and VAD...');
    try { await (window as any).electronAPI.invoke('bidirectional:state', { id: Date.now().toString(), timestamp: Date.now(), payload: { action: 'start' } }); } catch {}
    // VAD setup (simple amplitude-based)
    try {
        // Use default sample rate for broad compatibility
        bidiAnalyzerCtx = new AudioContext();
    } catch (e) {
        logToDebug('❌ Failed to create AudioContext for Bidirectional');
        throw e;
    }
    bidiSourceNode = bidiAnalyzerCtx.createMediaStreamSource(audioStream);
    bidiAnalyzerNode = bidiAnalyzerCtx.createAnalyser();
    bidiAnalyzerNode.fftSize = 2048;
    bidiAnalyzerNode.smoothingTimeConstant = 0.3;
    bidiSourceNode.connect(bidiAnalyzerNode);
    
    console.log('🔊 Audio analysis setup complete:', {
        contextState: bidiAnalyzerCtx.state,
        sampleRate: bidiAnalyzerCtx.sampleRate,
        fftSize: bidiAnalyzerNode.fftSize,
        streamTracks: audioStream.getTracks().length
    });
    bidiLastVoiceTs = Date.now();
    console.log('🔄 Starting VAD interval...');
    bidiVadInterval = window.setInterval(() => {
        if (!bidiAnalyzerNode) {
            console.log('❌ VAD: analyzer node not available');
            return;
        }
        try {
            const buf = new Uint8Array(bidiAnalyzerNode.fftSize);
            bidiAnalyzerNode.getByteTimeDomainData(buf);
            // Compute normalized volume
            let sum = 0;
            for (let i = 0; i < buf.length; i++) {
                const val = (buf[i] - 128) / 128;
                sum += Math.abs(val);
            }
            const vol = sum / buf.length;
            const voiceActive = vol > 0.01; // Reset to normal threshold for system audio (desktop capture)
            
            // Always log volume every few cycles to confirm VAD is working
            if (Math.random() < 0.1) { // 10% of the time
                console.log(`🎤 Audio level: ${vol.toFixed(4)} (threshold: 0.01, active: ${voiceActive}, bufLen: ${buf.length})`);
            }
            
            if (voiceActive) {
                console.log(`🎯 Voice detected! Level: ${vol.toFixed(4)}`);
            }
        if (voiceActive) bidiLastVoiceTs = Date.now();
        bidiInSpeech = voiceActive;
        const silenceMs = Date.now() - bidiLastVoiceTs;
        // On speech onset, schedule a language probe if no section and not blocked
        if (voiceActive && !bidiSectionActive && !bidiSectionBlocked && !bidiNeedsProbe) {
            console.log('🎯 Setting probe flag - speech detected');
            try { 
                (window as any).electronAPI.invoke('bidirectional:log', { 
                    id: Date.now().toString(), 
                    timestamp: Date.now(), 
                    payload: { level: 'info', message: 'VAD triggered - probe needed', data: { volume: vol.toFixed(4) } } 
                }); 
            } catch {}
            bidiNeedsProbe = true;
        }
        // On sustained silence, finalize section or clear block
        if (!voiceActive && silenceMs > 800) {
            if (bidiSectionActive) {
                finalizeBidirectionalSection().catch(() => {});
            } else if (bidiSectionBlocked) {
                bidiSectionBlocked = false; // allow probing on next speech
            }
        }
        } catch (e) {
            console.warn('❌ VAD error:', e);
            // analyzer may throw if context is closed; stop interval
            if (bidiVadInterval) {
                clearInterval(bidiVadInterval);
                bidiVadInterval = null;
            }
        }
    }, 200); // 5 Hz - slower for more stable detection

    // Recorder
    bidiMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    try {
        bidiRecorder = new MediaRecorder(audioStream, { mimeType: bidiMimeType });
    } catch (e) {
        // Fallback without mimeType if not supported
        logToDebug('⚠️ MediaRecorder with preferred mimeType failed, retrying with default');
        bidiRecorder = new MediaRecorder(audioStream);
    }
    bidiRecorder.ondataavailable = async (evt) => {
        console.log(`📥 Recorder data available: ${evt.data?.size || 0} bytes, needsProbe: ${bidiNeedsProbe}, sectionActive: ${bidiSectionActive}`);
        if (!isBidirectionalActive || !evt.data || evt.data.size === 0) {
            console.log('❌ Skipping data - inactive or empty');
            return;
        }
        try {
            const targetLang = languageSelect.value || 'en';
            // If we are inside a target-language section, just accumulate locally (no API call)
            if (bidiSectionActive) {
                bidiCurrentBlobs.push(evt.data);
                console.log(`📊 Accumulated chunk, total blobs: ${bidiCurrentBlobs.length}`);
                return;
            }
            // If we need a language probe (speech onset), send minimal probe
            if (bidiNeedsProbe) {
                console.log('🔍 Processing probe request...');
                bidiNeedsProbe = false;
                // Convert probe to WAV for compatibility
                let wavProbe: Blob;
                try {
                    wavProbe = await convertToWav(evt.data);
                } catch (e) {
                    // Fallback: use original blob if conversion fails
                    wavProbe = evt.data;
                }
                const arrBuf = await wavProbe.arrayBuffer();
                const audioData = Array.from(new Uint8Array(arrBuf));
                const resp = await (window as any).electronAPI.invoke('speech:transcribe', {
                    id: Date.now().toString(), timestamp: Date.now(), payload: { audioData, language: 'auto', contentType: 'audio/wav' }
                });
                if (resp.success) {
                    const detectedLang = resp.payload.language || 'unknown';
                    try { await (window as any).electronAPI.invoke('bidirectional:log', { id: Date.now().toString(), timestamp: Date.now(), payload: { level: 'info', message: 'Probe result', data: { detectedLang } } }); } catch {}
                    if (detectedLang === targetLang) {
                        // Start section: include this probe chunk
                        bidiSectionActive = true;
                        bidiCurrentBlobs = [evt.data];
                        if (bidirectionalDetectedText) {
                            const snippet = (resp.payload.text || '').trim();
                            bidirectionalDetectedText.textContent = snippet || 'Listening...';
                            bidirectionalDetectedText.classList.remove('empty');
                        }
                    } else {
                        // Block until next silence to avoid repeated probes during same non-target speech
                        bidiSectionBlocked = true;
                    }
                } else {
                    try { await (window as any).electronAPI.invoke('bidirectional:log', { id: Date.now().toString(), timestamp: Date.now(), payload: { level: 'warn', message: 'Probe STT failed', data: { error: resp.error } } }); } catch {}
                }
            }
        } catch {
            // ignore probe errors
        }
    };
    // Use a moderate timeslice (~3s) to ensure probe has enough speech
    try {
        bidiRecorder.start(3000);
    } catch (e) {
        logToDebug('❌ Failed to start MediaRecorder in Bidirectional');
        await stopBidirectional();
        throw e;
    }
    isBidirectionalActive = true;
    setBidirectionalStatus(true);
    logToDebug('👂 Bidirectional is listening for target language speech...');
    try { await (window as any).electronAPI.invoke('bidirectional:log', { id: Date.now().toString(), timestamp: Date.now(), payload: { level: 'info', message: 'Listening', data: { targetLanguage: languageSelect.value } } }); } catch {}
}

async function stopBidirectional(): Promise<void> {
    isBidirectionalActive = false;
    setBidirectionalStatus(false);
    try {
        if (bidiRecorder && bidiRecorder.state !== 'inactive') bidiRecorder.stop();
    } catch {}
    bidiRecorder = null;
    try {
        if (bidiAudioStream) {
            bidiAudioStream.getTracks().forEach(t => t.stop());
        }
    } catch {}
    bidiAudioStream = null;
    if (bidiVadInterval) {
        clearInterval(bidiVadInterval);
        bidiVadInterval = null;
    }
    try {
        if (bidiAnalyzerCtx && bidiAnalyzerCtx.state !== 'closed') await bidiAnalyzerCtx.close();
    } catch {}
    bidiAnalyzerCtx = null;
    bidiAnalyzerNode = null;
    bidiSourceNode = null;
    pendingFinalize = false;
    bidiSectionActive = false;
    bidiCurrentBlobs = [];
    logToDebug('⏹️ Bidirectional stopped');
    try { await (window as any).electronAPI.invoke('bidirectional:state', { id: Date.now().toString(), timestamp: Date.now(), payload: { action: 'stop' } }); } catch {}
}

async function finalizeBidirectionalSection(): Promise<void> {
    if (!bidiSectionActive || bidiProcessing) return;
    bidiProcessing = true;
    pendingFinalize = false;
    try {
        // Combine blobs
        const combined = new Blob(bidiCurrentBlobs, { type: bidiMimeType });
        // Convert to WAV for best Whisper compatibility
        const wavBlob = await convertToWav(combined);
        const arrBuf = await wavBlob.arrayBuffer();
        const audioData = Array.from(new Uint8Array(arrBuf));
        const resp = await (window as any).electronAPI.invoke('speech:transcribe', {
            id: Date.now().toString(), timestamp: Date.now(), payload: { audioData, language: 'auto', contentType: 'audio/wav' }
        });
        if (resp.success) {
            const text = (resp.payload.text || '').trim();
            try { await (window as any).electronAPI.invoke('bidirectional:log', { id: Date.now().toString(), timestamp: Date.now(), payload: { level: 'info', message: 'Final section transcribed', data: { len: text.length } } }); } catch {}
            if (bidirectionalDetectedText) {
                bidirectionalDetectedText.textContent = text || 'No speech detected';
                bidirectionalDetectedText.classList.toggle('empty', !text);
            }
            if (text && incomingVoiceId) {
                // Synthesize in incoming voice and play via selected sink
                const tts = await (window as any).electronAPI.invoke('tts:synthesize', {
                    id: Date.now().toString(), timestamp: Date.now(), payload: { text, voiceId: incomingVoiceId }
                });
                if (tts.success && tts.payload?.audioBuffer) {
                    try { await (window as any).electronAPI.invoke('bidirectional:log', { id: Date.now().toString(), timestamp: Date.now(), payload: { level: 'info', message: 'TTS ready', data: { bytes: tts.payload.audioBuffer.length } } }); } catch {}
                    if (bidirectionalRespokenText) {
                        bidirectionalRespokenText.textContent = text;
                        bidirectionalRespokenText.classList.remove('empty');
                    }
                    await playAudioToDevice(tts.payload.audioBuffer, bidirectionalOutputDeviceId || undefined);
                }
            } else {
                try { await (window as any).electronAPI.invoke('bidirectional:log', { id: Date.now().toString(), timestamp: Date.now(), payload: { level: 'warn', message: 'No text or voice for TTS' } }); } catch {}
            }
        } else {
            try { await (window as any).electronAPI.invoke('bidirectional:log', { id: Date.now().toString(), timestamp: Date.now(), payload: { level: 'warn', message: 'Final STT failed', data: { error: resp.error } } }); } catch {}
        }
    } catch (e) {
        // ignore
    } finally {
        // Reset for next section
        bidiSectionActive = false;
        bidiCurrentBlobs = [];
        bidiProcessing = false;
    }
}

async function playAudioToDevice(audioBufferArray: number[], sinkId?: string): Promise<void> {
    const audioBuffer = new Uint8Array(audioBufferArray).buffer;
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    return new Promise((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(undefined); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(undefined); };
        audio.src = url;
        if (sinkId && 'setSinkId' in audio) {
            (audio as any).setSinkId(sinkId).catch(() => {});
        }
        audio.play().catch(() => resolve(undefined));
    });
}

async function onMicrophoneChange(): Promise<void> {
    const selectedDevice = microphoneSelect.value;
    logToDebug(`Microphone changed to: ${selectedDevice || 'None'}`);
    
    // Save the selection
    try {
        await (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: { selectedMicrophone: selectedDevice }
        });
    } catch (error) {
        logToDebug(`Error saving microphone selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function onLanguageChange(): Promise<void> {
    const selectedLanguage = languageSelect.value;
    const languageName = languageSelect.options[languageSelect.selectedIndex].text;
    logToDebug(`Target language changed to: ${languageName} (${selectedLanguage})`);
    
    // Save the selection
    try {
        await (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: { targetLanguage: selectedLanguage }
        });
    } catch (error) {
        logToDebug(`Error saving language selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function onVoiceChange(): Promise<void> {
    const selectedVoice = voiceSelect.value;
    logToDebug(`Voice changed to: ${selectedVoice}`);
    
    // Save the selection
    try {
        await (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: { selectedVoice: selectedVoice }
        });
    } catch (error) {
        logToDebug(`Error saving voice selection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function refreshDevicesAndVoices(): Promise<void> {
    try {
        refreshButton.disabled = true;
        refreshButton.textContent = '🔄 Refreshing...';
        
        logToDebug('Refreshing devices and voices...');
        
        await Promise.all([
            loadMicrophoneDevices(),
            loadVoices()
        ]);
        
        logToDebug('✅ Devices and voices refreshed successfully');
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ Refresh failed: ${errorMessage}`);
    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = '🔄 Refresh Devices';
    }
}

async function loadVoices(): Promise<void> {
    try {
        logToDebug('Loading available voices...');
        
        // Clear existing options
        voiceSelect.innerHTML = '<option value="">Select voice...</option>';
        
        // Try to load voices from ElevenLabs API
        let voices = [];
        try {
            const response = await (window as any).electronAPI.invoke('voice:get-voices', {
                id: Date.now().toString(),
                timestamp: Date.now(),
                payload: null
            });
            
            if (response.success && response.payload) {
                voices = response.payload;
                logToDebug(`Loaded ${voices.length} voices from ElevenLabs`);
            }
        } catch (error) {
            logToDebug('Failed to load voices from API, using defaults');
        }
        
        // If no voices from API, use mock voices
        if (voices.length === 0) {
            voices = [
                { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Male, English)', isCloned: false },
                { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Female, English)', isCloned: false },
                { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (Male, English)', isCloned: false },
                { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Male, English)', isCloned: false }
            ];
        }
        
        // Add standard voices
        voices.forEach((voice: any) => {
            const option = document.createElement('option');
            option.value = voice.id;
            option.textContent = voice.name;
            voiceSelect.appendChild(option);
        });
        
        // Load and add custom voices
        await loadCustomVoices();
        
        logToDebug(`Total voices available: ${voiceSelect.options.length - 1}`); // -1 for the "Select voice..." option
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`Error loading voices: ${errorMessage}`);
        voiceSelect.innerHTML = '<option value="">Error loading voices</option>';
    }
}

async function loadCustomVoices(): Promise<void> {
    try {
        // Get custom voices from configuration
        const response = await (window as any).electronAPI.invoke('config:get', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: null
        });

        if (response.success && response.payload.customVoices) {
            const customVoices = response.payload.customVoices;
            
            if (customVoices.length > 0) {
                // Add separator
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = '── Custom Voices ──';
                voiceSelect.appendChild(separator);
                
                // Add custom voices
                customVoices.forEach((voice: any) => {
                    const option = document.createElement('option');
                    option.value = voice.id;
                    option.textContent = `${voice.name} (Custom)`;
                    option.dataset.custom = 'true';
                    voiceSelect.appendChild(option);
                });
                
                logToDebug(`Loaded ${customVoices.length} custom voices`);
            }
        }
    } catch (error) {
        logToDebug('No custom voices found or error loading them');
    }
}

async function initializeLanguageSelector(): Promise<void> {
    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'de', name: 'German', flag: '🇩🇪' },
        { code: 'it', name: 'Italian', flag: '🇮🇹' },
        { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
        { code: 'ru', name: 'Russian', flag: '🇷🇺' },
        { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', flag: '🇰🇷' },
        { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
        { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'th', name: 'Thai', flag: '🇹🇭' },
        { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
        { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
        { code: 'pl', name: 'Polish', flag: '🇵🇱' },
        { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
        { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
        { code: 'da', name: 'Danish', flag: '🇩🇰' },
        { code: 'no', name: 'Norwegian', flag: '🇳🇴' }
    ];

    // Clear existing options
    languageSelect.innerHTML = '';

    // Add language options
    languages.forEach(language => {
        const option = document.createElement('option');
        option.value = language.code;
        option.textContent = `${language.flag} ${language.name}`;
        languageSelect.appendChild(option);
    });

    // Set default to Spanish
    languageSelect.value = 'es';
    
    // Load voices after language selector is ready
    await loadVoices();
}

async function loadMicrophoneDevices(): Promise<void> {
    try {
        logToDebug('Loading microphone devices...');
        
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            // Stop the stream immediately, we just needed permission
            stream.getTracks().forEach(track => track.stop());
        });
        
        // Get available devices directly from Web API
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        // Clear existing options
        microphoneSelect.innerHTML = '<option value="">Select microphone...</option>';
        
        // Add device options
        audioInputs.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${index + 1}`;
            
            if (device.deviceId === 'default') {
                option.textContent += ' (Default)';
            }
            
            microphoneSelect.appendChild(option);
        });
        
        logToDebug(`Found ${audioInputs.length} audio input devices`);
        connectionStatus.textContent = 'Ready';
        
    } catch (error) {
        console.error('Error loading microphone devices:', error);
        logToDebug(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        connectionStatus.textContent = 'Microphone access denied';
        
        // Add a message option when permission is denied
        microphoneSelect.innerHTML = '<option value="">Microphone access denied - please allow microphone access</option>';
    }
}

function updateStatusIndicator(status?: string): void {
    const indicator = document.getElementById('status-indicator') as HTMLElement;
    
    if (indicator) {
        // Clear all status classes
        indicator.classList.remove('active', 'error');
        
        // Set appropriate status
        if (status === 'error') {
            indicator.classList.add('error');
        } else if (status === 'active' || isTranslating) {
            indicator.classList.add('active');
        }
    }
}

function logToDebug(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugOutput.appendChild(logEntry);
    
    // Auto-scroll to bottom
    debugConsole.scrollTop = debugConsole.scrollHeight;
    
    // Keep only last 100 entries
    while (debugOutput.children.length > 100) {
        debugOutput.removeChild(debugOutput.firstChild!);
    }
}

// Handle device changes
if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', () => {
        logToDebug('Audio devices changed, refreshing list...');
        loadMicrophoneDevices();
    });
}

async function updateApiKeys(apiKeys: any): Promise<void> {
    try {
        const response = await (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: { apiKeys }
        });

        if (response.success) {
            logToDebug('API keys updated successfully');
            checkApiKeysConfiguration();
        } else {
            logToDebug('Error updating API keys');
        }
    } catch (error) {
        logToDebug(`Error updating API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function checkApiKeysConfiguration(): Promise<void> {
    try {
        const response = await (window as any).electronAPI.invoke('config:get', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: null
        });

        if (response.success) {
            const config = response.payload;
            const hasOpenAI = config.apiKeys.openai && config.apiKeys.openai.length > 0;
            const hasElevenLabs = config.apiKeys.elevenlabs && config.apiKeys.elevenlabs.length > 0;

            // Restore UI state from configuration
            if (config.selectedMicrophone && microphoneSelect) {
                microphoneSelect.value = config.selectedMicrophone;
            }
            
            if (config.targetLanguage && languageSelect) {
                languageSelect.value = config.targetLanguage;
            }
            
            if (config.selectedVoice && voiceSelect) {
                voiceSelect.value = config.selectedVoice;
            }
            
            if (config.uiSettings?.showDebugConsole !== undefined) {
                isDebugVisible = config.uiSettings.showDebugConsole;
                if (isDebugVisible) {
                    debugConsole.classList.add('visible');
                    debugToggle.textContent = 'Hide Debug Console';
                } else {
                    debugConsole.classList.remove('visible');
                    debugToggle.textContent = 'Show Debug Console';
                }
            }

            if (!hasOpenAI || !hasElevenLabs) {
                connectionStatus.textContent = 'API keys required';
                logToDebug('Missing required API keys - please configure in settings');
            } else {
                connectionStatus.textContent = 'Ready';
                logToDebug('API keys configured');
            }
        }
    } catch (error) {
        logToDebug(`Error checking API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function setupTranslationStatusUpdates(): void {
    // Set up periodic status checks while translation is active
    const statusInterval = setInterval(async () => {
        if (!isTranslating) {
            clearInterval(statusInterval);
            return;
        }
        
        try {
            const response = await (window as any).electronAPI.invoke('pipeline:get-status', {
                id: Date.now().toString(),
                timestamp: Date.now(),
                payload: null
            });
            
            if (response.success && response.payload) {
                const status = response.payload;
                processingStatus.textContent = status.currentStep || 'Active';
                
                if (status.error) {
                    logToDebug(`⚠️ Processing error: ${status.error}`);
                    updateStatusIndicator('error');
                } else if (status.isActive) {
                    updateStatusIndicator('active');
                }
                
                // Log performance metrics if available
                if (status.performance && status.performance.totalLatency > 0) {
                    logToDebug(`⚡ Processing latency: ${status.performance.totalLatency}ms`);
                }
            }
        } catch (error) {
            // Silently handle status check errors to avoid spam
        }
    }, 1000); // Check every second
}

async function testHearYourself(): Promise<void> {
    try {
        hearYourselfButton.disabled = true;
        hearYourselfButton.textContent = '🎧 Recording...';
        
        if (!microphoneSelect.value) {
            throw new Error('Please select a microphone first');
        }
        
        logToDebug('Starting "hear yourself" test - recording 3 seconds of audio...');
        
        // Start recording from microphone
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: microphoneSelect.value,
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            
            try {
                // Play the recorded audio back through headphones
                const audio = new Audio();
                const url = URL.createObjectURL(audioBlob);
                audio.src = url;
                
                await new Promise<void>((resolve, reject) => {
                    audio.onended = () => {
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    
                    audio.onerror = (error) => {
                        URL.revokeObjectURL(url);
                        reject(new Error(`Audio playback failed: ${error}`));
                    };
                    
                    audio.play().catch(reject);
                });
                
                logToDebug('✅ "Hear yourself" test completed - you should have heard your recorded voice');
                
            } catch (error) {
                logToDebug(`❌ Audio playback error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            }
        };
        
        mediaRecorder.start();
        
        // Record for 3 seconds
        setTimeout(() => {
            mediaRecorder.stop();
        }, 3000);
        
        // Update button after recording completes
        setTimeout(() => {
            hearYourselfButton.disabled = false;
            hearYourselfButton.textContent = '🎧 Hear Yourself';
        }, 3500);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ "Hear yourself" test failed: ${errorMessage}`);
        
        hearYourselfButton.disabled = false;
        hearYourselfButton.textContent = '🎧 Hear Yourself';
    }
}

async function testVirtualMicrophone(): Promise<void> {
    try {
        virtualMicTestButton.disabled = true;
        virtualMicTestButton.textContent = '📢 Testing...';
        
        logToDebug('Testing virtual microphone output...');
        
        // Test the virtual microphone with a simple message
        const response = await (window as any).electronAPI.invoke('pipeline:test', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: {
                text: 'This is a test of the virtual microphone output. Other applications should be able to hear this.',
                targetLanguage: languageSelect.value || 'en', // Use same language for testing
                voiceId: voiceSelect.value || 'pNInz6obpgDQGcFmaJgB',
                outputToHeadphones: false // This should go to virtual microphone
            }
        });

        if (response.success) {
            logToDebug('✅ Virtual microphone test completed');
            logToDebug('Other applications should now be able to hear the test audio through the virtual microphone');
            processingStatus.textContent = 'Virtual mic test passed';
        } else {
            throw new Error(response.error || 'Virtual microphone test failed');
        }
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ Virtual microphone test failed: ${errorMessage}`);
        processingStatus.textContent = `Virtual mic test error: ${errorMessage}`;
    } finally {
        virtualMicTestButton.disabled = false;
        virtualMicTestButton.textContent = '📢 Test Virtual Mic';
    }
}

async function showAddVoiceModal(): Promise<void> {
    logToDebug('Opening add custom voice modal...');
    
    // Create modal for adding custom voice
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 12px;
        width: 500px;
        max-width: 90%;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    modalContent.innerHTML = `
        <h2 style="margin-bottom: 1rem; color: #333;">➕ Add Custom Voice</h2>
        <p style="margin-bottom: 1.5rem; color: #666; line-height: 1.5;">
            Enter a custom ElevenLabs voice ID to add it to your voice list. You can find voice IDs in your ElevenLabs account or use public voice IDs.
        </p>
        
        <div style="margin-bottom: 1rem;">
            <label for="voice-id-input" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Voice ID:</label>
            <input type="text" id="voice-id-input" placeholder="e.g., pNInz6obpgDQGcFmaJgB" 
                   class="voice-modal-input" style="width: 100%; padding: 0.75rem; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 1rem;">
            <small style="color: #666; margin-top: 0.25rem; display: block;">
                Voice ID should be a 20-character alphanumeric string
            </small>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <label for="voice-name-input" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Display Name (optional):</label>
            <input type="text" id="voice-name-input" placeholder="e.g., My Custom Voice" 
                   class="voice-modal-input" style="width: 100%; padding: 0.75rem; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 1rem;">
            <small style="color: #666; margin-top: 0.25rem; display: block;">
                If not provided, the voice ID will be used as the name
            </small>
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="test-voice-checkbox" style="margin-right: 0.5rem;">
                <span>Test voice before adding</span>
            </label>
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="cancel-voice-btn" class="voice-modal-button" style="padding: 0.75rem 1.5rem; border: 2px solid #ddd; background: white; border-radius: 8px; cursor: pointer;">
                Cancel
            </button>
            <button id="test-voice-btn" class="voice-modal-button" style="padding: 0.75rem 1.5rem; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 8px; cursor: pointer;">
                🧪 Test Voice
            </button>
            <button id="add-voice-btn" class="voice-modal-button" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer;">
                ➕ Add Voice
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    const voiceIdInput = modalContent.querySelector('#voice-id-input') as HTMLInputElement;
    const voiceNameInput = modalContent.querySelector('#voice-name-input') as HTMLInputElement;
    const testVoiceCheckbox = modalContent.querySelector('#test-voice-checkbox') as HTMLInputElement;
    const testVoiceBtn = modalContent.querySelector('#test-voice-btn') as HTMLButtonElement;
    const addVoiceBtn = modalContent.querySelector('#add-voice-btn') as HTMLButtonElement;
    const cancelBtn = modalContent.querySelector('#cancel-voice-btn') as HTMLButtonElement;
    
    // Focus on voice ID input
    voiceIdInput.focus();
    
    // Handle test voice
    testVoiceBtn.addEventListener('click', async () => {
        const voiceId = voiceIdInput.value.trim();
        if (!voiceId) {
            alert('Please enter a voice ID first');
            return;
        }
        
        if (!isValidVoiceId(voiceId)) {
            alert('Please enter a valid voice ID (20-character alphanumeric string)');
            return;
        }
        
        try {
            testVoiceBtn.disabled = true;
            testVoiceBtn.textContent = '🧪 Testing...';
            
            logToDebug(`Testing custom voice ID: ${voiceId}`);
            
            // Test the voice with a sample text
            const response = await (window as any).electronAPI.invoke('pipeline:test', {
                id: Date.now().toString(),
                timestamp: Date.now(),
                payload: {
                    text: 'Hello, this is a test of your custom voice.',
                    targetLanguage: 'en', // Test in English
                    voiceId: voiceId,
                    outputToHeadphones: true
                }
            });

            if (response.success) {
                logToDebug('✅ Custom voice test successful');
                alert('Voice test successful! You should have heard the test audio.');
                testVoiceCheckbox.checked = true;
            } else {
                throw new Error(response.error || 'Voice test failed');
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logToDebug(`❌ Custom voice test failed: ${errorMessage}`);
            alert(`Voice test failed: ${errorMessage}`);
        } finally {
            testVoiceBtn.disabled = false;
            testVoiceBtn.textContent = '🧪 Test Voice';
        }
    });
    
    // Handle add voice
    addVoiceBtn.addEventListener('click', async () => {
        const voiceId = voiceIdInput.value.trim();
        const voiceName = voiceNameInput.value.trim();
        
        if (!voiceId) {
            alert('Please enter a voice ID');
            return;
        }
        
        if (!isValidVoiceId(voiceId)) {
            alert('Please enter a valid voice ID (20-character alphanumeric string)');
            return;
        }
        
        // If test is required and not done, prompt user
        if (testVoiceCheckbox.checked && !testVoiceCheckbox.dataset.tested) {
            alert('Please test the voice first by clicking "Test Voice"');
            return;
        }
        
        try {
            addVoiceBtn.disabled = true;
            addVoiceBtn.textContent = '➕ Adding...';
            
            const displayName = voiceName || `Custom Voice (${voiceId.substring(0, 8)}...)`;
            
            // Add the voice to the dropdown
            await addCustomVoiceToList(voiceId, displayName);
            
            logToDebug(`✅ Custom voice added: ${displayName} (${voiceId})`);
            
            // Close modal
            document.body.removeChild(modal);
            
            // Select the newly added voice
            voiceSelect.value = voiceId;
            
            // Save the selection
            await (window as any).electronAPI.invoke('config:set', {
                id: Date.now().toString(),
                timestamp: Date.now(),
                payload: { selectedVoice: voiceId }
            });
            
            logToDebug(`Voice "${displayName}" added and selected successfully`);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logToDebug(`❌ Failed to add custom voice: ${errorMessage}`);
            alert(`Failed to add voice: ${errorMessage}`);
        } finally {
            addVoiceBtn.disabled = false;
            addVoiceBtn.textContent = '➕ Add Voice';
        }
    });
    
    // Handle cancel
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Handle click outside modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // Handle Enter key in inputs
    [voiceIdInput, voiceNameInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addVoiceBtn.click();
            }
        });
    });
}

function isValidVoiceId(voiceId: string): boolean {
    // ElevenLabs voice IDs are typically 20-character alphanumeric strings
    return /^[a-zA-Z0-9]{20}$/.test(voiceId);
}

async function addCustomVoiceToList(voiceId: string, displayName: string): Promise<void> {
    // Check if voice already exists
    const existingOption = Array.from(voiceSelect.options).find(option => option.value === voiceId);
    if (existingOption) {
        throw new Error('This voice ID is already in your list');
    }
    
    // Add the voice to the dropdown
    const option = document.createElement('option');
    option.value = voiceId;
    option.textContent = `${displayName} (Custom)`;
    option.dataset.custom = 'true';
    
    // Insert before the last option (which might be "Add Custom Voice")
    const lastOption = voiceSelect.options[voiceSelect.options.length - 1];
    voiceSelect.insertBefore(option, lastOption);
    
    // Save custom voices to configuration
    await saveCustomVoice(voiceId, displayName);
}

async function saveCustomVoice(voiceId: string, displayName: string): Promise<void> {
    try {
        // Get current config
        const response = await (window as any).electronAPI.invoke('config:get', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: null
        });

        if (response.success) {
            const config = response.payload;
            
            // Initialize custom voices array if it doesn't exist
            if (!config.customVoices) {
                config.customVoices = [];
            }
            
            // Add the new voice
            config.customVoices.push({
                id: voiceId,
                name: displayName,
                dateAdded: new Date().toISOString()
            });
            
            // Save updated config
            await (window as any).electronAPI.invoke('config:set', {
                id: Date.now().toString(),
                timestamp: Date.now(),
                payload: { customVoices: config.customVoices }
            });
        }
    } catch (error) {
        console.warn('Failed to save custom voice to config:', error);
        // Don't throw error as the voice is still added to the UI
    }
}

async function playAudioInRenderer(audioBufferArray: number[]): Promise<void> {
    try {
        console.log('🎵 Starting audio playback in renderer...');
        console.log(`📊 Input array length: ${audioBufferArray.length}`);
        
        // Convert array back to ArrayBuffer
        const audioBuffer = new Uint8Array(audioBufferArray).buffer;
        console.log(`📊 ArrayBuffer size: ${audioBuffer.byteLength} bytes`);
        
        // Create audio blob - ElevenLabs typically returns MP3
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        console.log(`📊 Blob size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        // Create audio element and play
        const audio = new Audio();
        const url = URL.createObjectURL(audioBlob);
        console.log(`🔗 Audio URL created: ${url.substring(0, 50)}...`);
        
        return new Promise((resolve, reject) => {
            let resolved = false;
            
            audio.onloadeddata = () => {
                console.log('📥 Audio data loaded successfully');
            };
            
            audio.oncanplay = () => {
                console.log('▶️ Audio can start playing');
            };
            
            audio.onended = () => {
                console.log('✅ Audio playback completed');
                URL.revokeObjectURL(url);
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            };
            
            audio.onerror = (error) => {
                console.error('❌ Audio element error:', error);
                URL.revokeObjectURL(url);
                if (!resolved) {
                    resolved = true;
                    reject(new Error(`Audio playback error: ${error}`));
                }
            };
            
            audio.src = url;
            if (outputToVirtualDevice && virtualOutputDeviceId && 'setSinkId' in audio) {
                (audio as any).setSinkId(virtualOutputDeviceId).then(() => {
                    console.log(`🔌 Routed TTS audio to virtual output: ${virtualOutputDeviceId}`);
                }).catch((err: any) => {
                    console.warn('⚠️ setSinkId failed, using default output', err);
                });
            }
            console.log('🎵 Starting audio.play()...');
            audio.play().catch(playError => {
                console.error('❌ Audio.play() failed:', playError);
                if (!resolved) {
                    resolved = true;
                    reject(new Error(`Audio play failed: ${playError.message || playError}`));
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Audio renderer error:', error);
        throw new Error(`Failed to play audio in renderer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ===== LIVE TRANSLATION FUNCTIONS =====

async function initializeRealTimeAudioStream(): Promise<void> {
    try {
        if (!microphoneSelect.value) {
            throw new Error('Please select a microphone first');
        }
        
        // Get audio stream with optimal settings for real-time processing
        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: microphoneSelect.value,
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        // Use MediaRecorder for simple continuous audio capture
        // Try different formats for better Whisper compatibility
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
        }
        
        mediaRecorder = new MediaRecorder(audioStream, { mimeType });
        
        // Clear any existing onstop handler to prevent conflicts with push-to-talk
        mediaRecorder.onstop = null;
        
        // Process audio chunks as they become available
        mediaRecorder.ondataavailable = async (event) => {
            if (!isTranslating || event.data.size === 0) return;
            
            // Prevent concurrent audio processing
            if (isProcessingAudio) {
                logToDebug('🔒 Skipping audio chunk - already processing another chunk');
                return;
            }
            
            // Skip very small audio chunks (likely silence)
            if (event.data.size < 10000) { // Less than ~10KB is likely silence
                logToDebug('🔇 Skipping small audio chunk (likely silence)');
                return;
            }
            
            isProcessingAudio = true;
            
            try {
                // Convert blob to array buffer
                const arrayBuffer = await event.data.arrayBuffer();
                const audioData = Array.from(new Uint8Array(arrayBuffer));
                
                logToDebug(`🎤 Processing audio chunk: ${event.data.size} bytes`);
                
                // Send to main process for transcription and translation
                await (window as any).electronAPI.invoke('speech:transcribe', {
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    payload: {
                        audioData: audioData,
                        language: 'auto'
                    }
                });
                
            } catch (error) {
                console.error('Error processing audio chunk:', error);
                logToDebug(`❌ Audio processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                // Always clear the processing flag
                isProcessingAudio = false;
            }
        };
        
        // Start recording in chunks (every 10 seconds for real-time processing)
        mediaRecorder.start(10000);
        
        logToDebug('✅ Real-time audio stream initialized with MediaRecorder');
        recordingText.textContent = 'Listening continuously...';
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ Failed to initialize real-time audio stream: ${errorMessage}`);
        throw error;
    }
}

// Restart real-time audio capture to prevent corruption
async function restartRealTimeAudioCapture(): Promise<void> {
    try {
        if (!isTranslating) {
            logToDebug('⚠️ Not restarting audio capture - translation not active');
            return;
        }
        
        logToDebug('🔄 Restarting real-time audio capture...');
        
        // Use the existing audio stream if it's still active
        if (!audioStream || audioStream.getTracks().some(track => track.readyState === 'ended')) {
            // Get fresh audio stream
            audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: microphoneSelect.value,
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        }
        
        // Create new MediaRecorder
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
        }
        
        mediaRecorder = new MediaRecorder(audioStream, { mimeType });
        
        // Clear any existing onstop handler to prevent conflicts with push-to-talk
        mediaRecorder.onstop = null;
        
        // Set up the data handler again
        mediaRecorder.ondataavailable = async (event) => {
            if (!isTranslating || event.data.size === 0) return;
            
            // Prevent concurrent audio processing
            if (isProcessingAudio) {
                logToDebug('🔒 Skipping audio chunk - already processing another chunk');
                return;
            }
            
            // Skip very small audio chunks (likely silence)
            if (event.data.size < 10000) { // Less than ~10KB is likely silence
                logToDebug('🔇 Skipping small audio chunk (likely silence)');
                return;
            }
            
            isProcessingAudio = true;
            
            try {
                // Convert blob to array buffer
                const arrayBuffer = await event.data.arrayBuffer();
                const audioData = Array.from(new Uint8Array(arrayBuffer));
                
                logToDebug(`🎤 Processing audio chunk: ${event.data.size} bytes`);
                
                // Send to main process for transcription and translation
                await (window as any).electronAPI.invoke('speech:transcribe', {
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    payload: {
                        audioData: audioData,
                        language: 'auto'
                    }
                });
                
            } catch (error) {
                console.error('Error processing audio chunk:', error);
                logToDebug(`❌ Audio processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                // Always clear the processing flag
                isProcessingAudio = false;
            }
        };
        
        // Start recording in chunks
        mediaRecorder.start(10000);
        
        logToDebug('✅ Real-time audio capture restarted successfully');
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ Failed to restart real-time audio capture: ${errorMessage}`);
        console.error('Restart audio capture error:', error);
    }
}

async function initializeAudioStream(): Promise<void> {
    try {
        if (!microphoneSelect.value) {
            throw new Error('Please select a microphone first');
        }
        
        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: microphoneSelect.value,
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        logToDebug('✅ Audio stream initialized for live translation');
        recordingText.textContent = `Hold ${currentKeybind} to record`;
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ Failed to initialize audio stream: ${errorMessage}`);
        throw error;
    }
}

async function cleanupAudioStream(): Promise<void> {
    try {
        if (isRecording) {
            await stopRecording();
        }
        await stopPassThrough();
        
        // Clean up MediaRecorder
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder = null;
        }
        
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }
        
        logToDebug('✅ Audio stream cleaned up');
        
    } catch (error) {
        logToDebug(`⚠️ Error during audio cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function handleKeyDown(event: KeyboardEvent): void {
    if (!isTranslating || isRecording) return;
    
    const keyPressed = event.code;
    if (keyPressed === currentKeybind) {
        event.preventDefault();
        startRecording();
    }
}

function handleKeyUp(event: KeyboardEvent): void {
    if (!isTranslating || !isRecording) return;
    
    const keyPressed = event.code;
    if (keyPressed === currentKeybind) {
        event.preventDefault();
        stopRecording();
    }
}

async function startRecording(): Promise<void> {
    if (!audioStream || isRecording) return;
    
    try {
        isRecording = true;
        audioChunks = [];
        await stopPassThrough();
        
        // Update UI
        const recordingDot = document.querySelector('.recording-dot') as HTMLElement;
        recordingDot.classList.add('active');
        recordingText.textContent = 'Recording... (release key to translate)';
        originalTextDiv.textContent = 'Listening...';
        originalTextDiv.classList.add('processing');
        translatedTextDiv.textContent = 'Waiting for speech...';
        translatedTextDiv.classList.add('empty');
        
        // Start recording
        mediaRecorder = new MediaRecorder(audioStream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            await processRecordedAudio();
        };
        
        mediaRecorder.start();
        logToDebug('🎤 Recording started');
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ Failed to start recording: ${errorMessage}`);
        isRecording = false;
        updateRecordingUI(false);
    }
}

async function stopRecording(): Promise<void> {
    if (!mediaRecorder || !isRecording) return;
    
    try {
        isRecording = false;
        
        // Update UI
        const recordingDot = document.querySelector('.recording-dot') as HTMLElement;
        recordingDot.classList.remove('active');
        recordingText.textContent = 'Processing...';
        
        logToDebug('🎤 Stopping recording...');
        
        // Stop recording
        mediaRecorder.stop();
        logToDebug('🎤 Recording stopped, waiting for processing...');
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ Failed to stop recording: ${errorMessage}`);
        console.error('Stop recording error:', error);
        updateRecordingUI(false);
    }
}

async function processRecordedAudio(): Promise<void> {
    try {
        // Only process if we have recorded audio chunks (push-to-talk mode)
        // isTranslating just means push-to-talk is enabled, not that we're in continuous mode
        
        logToDebug('🔄 Starting audio processing...');
        
        if (audioChunks.length === 0) {
            logToDebug('⚠️ No audio data recorded');
            updateRecordingUI(false);
            return;
        }
        
        // Create audio blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        logToDebug(`📊 Audio recorded: ${audioBlob.size} bytes`);
        
        // Update UI
        recordingText.textContent = 'Transcribing...';
        originalTextDiv.textContent = 'Converting speech to text...';
        
        try {
            // Send to speech-to-text using a separate push-to-talk endpoint
            logToDebug('🎤 Starting push-to-talk speech-to-text...');
            const transcription = await speechToTextPushToTalk(await audioBlob.arrayBuffer());
            logToDebug(`📝 Transcription result: "${transcription}"`);
            
            if (!transcription || transcription.trim().length === 0) {
                logToDebug('⚠️ No speech detected in recording');
                originalTextDiv.textContent = 'No speech detected';
                originalTextDiv.classList.remove('processing');
                originalTextDiv.classList.add('empty');
                updateRecordingUI(false);
                return;
            }
            
            // Update UI with transcription
            originalTextDiv.textContent = transcription;
            originalTextDiv.classList.remove('processing', 'empty');
            
        } catch (sttError) {
            logToDebug(`❌ Speech-to-text failed: ${sttError instanceof Error ? sttError.message : 'Unknown error'}`);
            console.error('STT Error:', sttError);
            originalTextDiv.textContent = `STT Error: ${sttError instanceof Error ? sttError.message : 'Unknown error'}`;
            originalTextDiv.classList.remove('processing');
            updateRecordingUI(false);
            return;
        }
        
        try {
            // Translate the text
            recordingText.textContent = 'Translating...';
            translatedTextDiv.textContent = 'Translating to target language...';
            translatedTextDiv.classList.add('processing');
            
            logToDebug('🌍 Starting translation...');
            const transcription = originalTextDiv.textContent;
            const translationResult = await translateText(transcription);
            logToDebug(`🌍 Translation result: "${translationResult}"`);
            
            // Update UI with translation
            translatedTextDiv.textContent = translationResult;
            translatedTextDiv.classList.remove('processing', 'empty');
            
        } catch (translationError) {
            logToDebug(`❌ Translation failed: ${translationError instanceof Error ? translationError.message : 'Unknown error'}`);
            console.error('Translation Error:', translationError);
            translatedTextDiv.textContent = `Translation Error: ${translationError instanceof Error ? translationError.message : 'Unknown error'}`;
            translatedTextDiv.classList.remove('processing');
            updateRecordingUI(false);
            return;
        }
        
        try {
            // Synthesize and play audio
            recordingText.textContent = 'Speaking...';
            logToDebug('🔊 Starting audio synthesis...');
            const translationResult = translatedTextDiv.textContent;
            await synthesizeAndPlay(translationResult);
            logToDebug('🔊 Audio synthesis completed');
            
        } catch (ttsError) {
            logToDebug(`❌ TTS failed: ${ttsError instanceof Error ? ttsError.message : 'Unknown error'}`);
            console.error('TTS Error:', ttsError);
            // Don't return here - the translation was successful even if TTS failed
        }
        
        // Reset UI
        updateRecordingUI(false);
        logToDebug('✅ Live translation completed successfully');
        await startPassThrough();
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`❌ Failed to process recorded audio: ${errorMessage}`);
        console.error('Process audio error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        originalTextDiv.textContent = `Error: ${errorMessage}`;
        originalTextDiv.classList.remove('processing');
        translatedTextDiv.textContent = 'Processing failed';
        translatedTextDiv.classList.remove('processing');
        updateRecordingUI(false);
    }
}

// Push-to-talk speech-to-text (separate from real-time)
async function speechToTextPushToTalk(audioBuffer: ArrayBuffer): Promise<string> {
    try {
        console.log('🎤 Starting push-to-talk speech-to-text...');
        console.log(`📊 Input audio buffer: ${audioBuffer.byteLength} bytes`);
        
        // Convert directly to array for IPC transfer
        const audioDataArray = Array.from(new Uint8Array(audioBuffer));
        console.log(`📊 Audio data array: ${audioDataArray.length} bytes`);
        
        // Send to main process for Whisper transcription (separate endpoint)
        console.log('📡 Sending to main process for push-to-talk transcription...');
        const response = await (window as any).electronAPI.invoke('speech:transcribe-push-to-talk', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: {
                audioData: audioDataArray,
                language: 'auto' // Auto-detect language
            }
        });

        console.log('📡 Received response from main process:', response.success);
        
        if (response.success) {
            const text = response.payload.text || '';
            console.log(`✅ Push-to-talk transcription successful: "${text}"`);
            return text;
        } else {
            console.error('❌ Push-to-talk transcription failed:', response.error);
            throw new Error(response.error || 'Speech-to-text failed');
        }
    } catch (error) {
        console.error('❌ Push-to-talk speech-to-text error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw new Error(`Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function speechToText(audioBuffer: ArrayBuffer): Promise<string> {
    try {
        console.log('🎤 Starting simplified speech-to-text...');
        console.log(`📊 Input audio buffer: ${audioBuffer.byteLength} bytes`);
        
        // For now, let's skip the complex audio conversion and just use the original audio
        // Convert directly to array for IPC transfer
        const audioDataArray = Array.from(new Uint8Array(audioBuffer));
        console.log(`📊 Audio data array: ${audioDataArray.length} bytes`);
        
        // Send to main process for Whisper transcription
        console.log('📡 Sending to main process for transcription...');
        const response = await (window as any).electronAPI.invoke('speech:transcribe', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: {
                audioData: audioDataArray,
                language: 'auto' // Auto-detect language
            }
        });

        console.log('📡 Received response from main process:', response.success);
        
        if (response.success) {
            const text = response.payload.text || '';
            console.log(`✅ Transcription successful: "${text}"`);
            return text;
        } else {
            console.error('❌ Transcription failed:', response.error);
            throw new Error(response.error || 'Speech-to-text failed');
        }
    } catch (error) {
        console.error('❌ Speech-to-text error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw new Error(`Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function convertToWav(audioBlob: Blob): Promise<Blob> {
    try {
        console.log('🔄 Starting audio conversion...');
        console.log(`📊 Input blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        // Create audio context for conversion
        const audioContext = new AudioContext({ sampleRate: 16000 });
        console.log('✅ Audio context created');
        
        // Decode the audio data
        const arrayBuffer = await audioBlob.arrayBuffer();
        console.log(`📊 Array buffer: ${arrayBuffer.byteLength} bytes`);
        
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`📊 Audio buffer: ${audioBuffer.length} samples, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`);
        
        // Convert to 16kHz mono WAV (optimal for Whisper)
        const length = audioBuffer.length;
        const sampleRate = 16000;
        const buffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);

        // Convert audio data to 16-bit PCM
        const channelData = audioBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }

        await audioContext.close();
        console.log(`✅ Audio conversion complete: ${buffer.byteLength} bytes`);
        return new Blob([buffer], { type: 'audio/wav' });
        
    } catch (error) {
        console.error('❌ Audio conversion error:', error);
        console.error('Error details:', error instanceof Error ? error.stack : 'No stack trace');
        // Fallback: return original blob
        console.log('🔄 Using original blob as fallback');
        return audioBlob;
    }
}

async function translateText(text: string): Promise<string> {
    try {
        const response = await (window as any).electronAPI.invoke('translation:translate', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: {
                text,
                targetLanguage: languageSelect.value || 'es',
                sourceLanguage: 'en'
            }
        });

        if (response.success && response.payload?.translatedText) {
            return response.payload.translatedText;
        }
        throw new Error(response.error || 'Translation failed');
    } catch (error) {
        throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function synthesizeAndPlay(text: string): Promise<void> {
    try {
        const response = await (window as any).electronAPI.invoke('tts:synthesize', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: {
                text,
                voiceId: voiceSelect.value || 'pNInz6obpgDQGcFmaJgB'
            }
        });

        if (response.success && response.payload?.audioBuffer) {
            await playAudioInRenderer(response.payload.audioBuffer);
            logToDebug('🔊 Translated audio played');
            return;
        }
        throw new Error(response.error || 'TTS synthesis failed');
    } catch (error) {
        logToDebug(`⚠️ Audio synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function updateRecordingUI(isActive: boolean): void {
    const recordingDot = document.querySelector('.recording-dot') as HTMLElement;
    
    if (isActive) {
        recordingDot.classList.add('active');
        recordingText.textContent = 'Recording...';
    } else {
        recordingDot.classList.remove('active');
        recordingText.textContent = `Hold ${currentKeybind} to record`;
    }
}

function showKeybindModal(): void {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 12px;
        width: 400px;
        max-width: 90%;
        text-align: center;
    `;
    
    modalContent.innerHTML = `
        <h2>Change Push-to-Talk Key</h2>
        <p>Press any key to set it as your push-to-talk key</p>
        <div style="margin: 2rem 0;">
            <div style="padding: 1rem; background: #f5f5f5; border-radius: 8px; font-size: 1.2rem;">
                Current: <kbd style="background: #667eea; color: white; padding: 0.5rem; border-radius: 4px;">${currentKeybind}</kbd>
            </div>
        </div>
        <button id="cancel-keybind" style="padding: 0.5rem 1rem; margin-right: 1rem;">Cancel</button>
        <button id="reset-keybind" style="padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 4px;">Reset to Space</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    let keyPressed = false;
    
    const keyListener = (event: KeyboardEvent) => {
        if (!keyPressed) {
            keyPressed = true;
            currentKeybind = event.code;
            currentKeybindSpan.textContent = event.code;
            recordingText.textContent = `Hold ${currentKeybind} to record`;
            logToDebug(`🔧 Push-to-talk key changed to: ${currentKeybind}`);
            document.body.removeChild(modal);
            document.removeEventListener('keydown', keyListener);
        }
    };
    
    document.addEventListener('keydown', keyListener);
    
    modalContent.querySelector('#cancel-keybind')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', keyListener);
    });
    
    modalContent.querySelector('#reset-keybind')?.addEventListener('click', () => {
        currentKeybind = 'Space';
        currentKeybindSpan.textContent = 'SPACE';
        recordingText.textContent = `Hold ${currentKeybind} to record`;
        logToDebug('🔧 Push-to-talk key reset to Space');
        document.body.removeChild(modal);
        document.removeEventListener('keydown', keyListener);
    });
}

// ===== Virtual Output Detection & Passthrough =====

async function detectVirtualOutputDevice(): Promise<void> {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        const preferred = outputs.find(d => /cable output|vb-audio|virtual/i.test(d.label));
        virtualOutputDeviceId = preferred?.deviceId || null;
        if (virtualOutputDeviceId) {
            logToDebug(`🎚️ Virtual output detected: ${preferred?.label || virtualOutputDeviceId}`);
        } else {
            logToDebug('ℹ️ No VB-CABLE output detected. Will use default system output for playback.');
        }
    } catch (e) {
        logToDebug('⚠️ Failed to enumerate audio outputs');
    }
}

async function startPassThrough(): Promise<void> {
    try {
        if (!audioStream) return;
        if (!passThroughAudioEl) {
            passThroughAudioEl = new Audio();
            passThroughAudioEl.autoplay = true;
            passThroughAudioEl.loop = false;
        }
        passThroughAudioEl.srcObject = audioStream as any;
        passThroughAudioEl.volume = 1.0;
        if (outputToVirtualDevice && virtualOutputDeviceId && 'setSinkId' in passThroughAudioEl) {
            try {
                await (passThroughAudioEl as any).setSinkId(virtualOutputDeviceId);
                logToDebug('🔁 Mic passthrough active → Virtual output');
            } catch (e) {
                logToDebug('⚠️ Could not route passthrough to virtual output, using default output');
            }
        } else {
            logToDebug('🔁 Mic passthrough active → System default output');
        }
        await passThroughAudioEl.play();
    } catch (e) {
        logToDebug('⚠️ Failed to start passthrough');
    }
}

async function stopPassThrough(): Promise<void> {
    try {
        if (passThroughAudioEl) {
            passThroughAudioEl.pause();
            passThroughAudioEl.srcObject = null;
        }
        logToDebug('⏹️ Mic passthrough paused');
    } catch {
        // no-op
    }
}

// ===== Output preference toggle =====

async function restoreOutputPreference(): Promise<void> {
    try {
        const response = await (window as any).electronAPI.invoke('config:get', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: null
        });
        if (response.success && response.payload?.uiSettings?.outputToVirtualDevice !== undefined) {
            outputToVirtualDevice = !!response.payload.uiSettings.outputToVirtualDevice;
        }
    } catch {}
    updateOutputToggleButton();
}

function updateOutputToggleButton(): void {
    if (!outputToggleButton) return;
    outputToggleButton.textContent = outputToVirtualDevice
        ? '🔀 Output: Virtual Device'
        : '🔀 Output: App/Headphones';
}

async function toggleOutputTarget(): Promise<void> {
    outputToVirtualDevice = !outputToVirtualDevice;
    updateOutputToggleButton();
    // Persist preference
    try {
        await (window as any).electronAPI.invoke('config:set', {
            id: Date.now().toString(),
            timestamp: Date.now(),
            payload: { uiSettings: { outputToVirtualDevice } }
        });
    } catch {}
    // Restart passthrough with new routing if active
    if (isTranslating && audioStream && !isRecording) {
        await stopPassThrough();
        await startPassThrough();
    }
}