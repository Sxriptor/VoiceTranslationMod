// Renderer process entry point
console.log('Renderer process starting...');

// DOM elements
const startButton = document.getElementById('start-button') as HTMLButtonElement;
const testButton = document.getElementById('test-button') as HTMLButtonElement;
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
            
            // Simulate stopping
            await new Promise(resolve => setTimeout(resolve, 500));
            
            isTranslating = false;
            startButton.textContent = '▶️ Start Translation';
            startButton.classList.remove('active');
            startButton.disabled = false;
            processingStatus.textContent = 'Idle';
            
            logToDebug('Translation stopped');
        } else {
            // Start translation
            startButton.disabled = true;
            startButton.textContent = '▶️ Starting...';
            
            // Simulate starting
            await new Promise(resolve => setTimeout(resolve, 500));
            
            isTranslating = true;
            startButton.textContent = '⏹️ Stop Translation';
            startButton.classList.add('active');
            startButton.disabled = false;
            processingStatus.textContent = 'Active';
            
            logToDebug('Translation started');
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
        updateStatusIndicator();
    }
}

async function testTranslation(): Promise<void> {
    try {
        testButton.disabled = true;
        testButton.textContent = '🧪 Testing...';
        
        logToDebug('Testing microphone access and device loading...');
        
        // Test microphone access and reload devices
        await loadMicrophoneDevices();
        
        logToDebug('✅ Test completed - microphone devices refreshed');
        processingStatus.textContent = 'Test passed';
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`Test failed: ${errorMessage}`);
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
        
        // Mock voices for now
        const mockVoices = [
            { id: 'adam', name: 'Adam (Male, English)' },
            { id: 'bella', name: 'Bella (Female, English)' },
            { id: 'charlie', name: 'Charlie (Male, English)' },
            { id: 'domi', name: 'Domi (Female, English)' }
        ];
        
        // Clear existing options
        voiceSelect.innerHTML = '<option value="">Select voice...</option>';
        
        // Add voice options
        mockVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.id;
            option.textContent = voice.name;
            voiceSelect.appendChild(option);
        });
        
        logToDebug(`Found ${mockVoices.length} available voices`);
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logToDebug(`Error loading voices: ${errorMessage}`);
        voiceSelect.innerHTML = '<option value="">Error loading voices</option>';
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

// Removed the processing state change handler since we're not using the orchestrator for now