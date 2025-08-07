// Renderer process entry point
console.log('Renderer process starting...');

// DOM elements
const startButton = document.getElementById('start-button') as HTMLButtonElement;
const testButton = document.getElementById('test-button') as HTMLButtonElement;
const addVoiceButton = document.getElementById('add-voice-button') as HTMLButtonElement;
const hearYourselfButton = document.getElementById('hear-yourself-button') as HTMLButtonElement;
const virtualMicTestButton = document.getElementById('virtual-mic-test-button') as HTMLButtonElement;
const settingsButton = document.getElementById('settings-button') as HTMLButtonElement;
const refreshButton = document.getElementById('refresh-button') as HTMLButtonElement;
const microphoneSelect = document.getElementById('microphone-select') as HTMLSelectElement;
const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
const debugToggle = document.getElementById('debug-toggle') as HTMLButtonElement;
const debugConsole = document.getElementById('debug-console') as HTMLDivElement;
const debugOutput = document.getElementById('debug-output') as HTMLDivElement;
const connectionStatus = document.getElementById('connection-status') as HTMLSpanElement;
const processingStatus = document.getElementById('processing-status') as HTMLSpanElement;
const statusIndicator = document.getElementById('status-indicator') as HTMLElement;

// Application state
let isTranslating = false;
let isDebugVisible = false;

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing application...');
    
    try {
        initializeEventListeners();
        await loadMicrophoneDevices();
        await initializeLanguageSelector();
        await checkApiKeysConfiguration();
        
        logToDebug('Application initialized successfully');
    } catch (error) {
        logToDebug(`Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});

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
    
    // Settings button
    settingsButton.addEventListener('click', openSettings);
    
    // Refresh button
    refreshButton.addEventListener('click', refreshDevicesAndVoices);
    
    // Debug toggle
    debugToggle.addEventListener('click', toggleDebugConsole);
    
    // Device selection
    microphoneSelect.addEventListener('change', onMicrophoneChange);
    
    // Language selection
    languageSelect.addEventListener('change', onLanguageChange);
    
    // Voice selection
    voiceSelect.addEventListener('change', onVoiceChange);
}

async function toggleTranslation(): Promise<void> {
    try {
        if (isTranslating) {
            // Stop translation
            startButton.disabled = true;
            startButton.textContent = '⏹️ Stopping...';
            
            const response = await (window as any).electronAPI.invoke('pipeline:stop', {
                id: Date.now().toString(),
                timestamp: Date.now(),
                payload: null
            });
            
            if (response.success) {
                isTranslating = false;
                startButton.textContent = '▶️ Start Translation';
                startButton.classList.remove('active');
                startButton.disabled = false;
                processingStatus.textContent = 'Idle';
                logToDebug('Translation stopped');
            } else {
                throw new Error(response.error || 'Failed to stop translation');
            }
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
            
            // Start translation
            startButton.disabled = true;
            startButton.textContent = '▶️ Starting...';
            
            const response = await (window as any).electronAPI.invoke('pipeline:start', {
                id: Date.now().toString(),
                timestamp: Date.now(),
                payload: {
                    microphoneId: microphoneSelect.value,
                    targetLanguage: languageSelect.value,
                    voiceId: voiceSelect.value,
                    outputToVirtualMic: true // Real-time mode outputs to virtual microphone
                }
            });
            
            if (response.success) {
                isTranslating = true;
                startButton.textContent = '⏹️ Stop Translation';
                startButton.classList.add('active');
                startButton.disabled = false;
                processingStatus.textContent = 'Active';
                logToDebug('Translation started - listening for audio...');
                
                // Set up real-time status updates
                setupTranslationStatusUpdates();
            } else {
                throw new Error(response.error || 'Failed to start translation');
            }
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
            
            // Now play the audio in the renderer process where browser APIs are available
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