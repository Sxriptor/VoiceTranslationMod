"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIPCHandlers = registerIPCHandlers;
exports.unregisterIPCHandlers = unregisterIPCHandlers;
const electron_1 = require("electron");
const channels_1 = require("./channels");
const ConfigurationManager_1 = require("../services/ConfigurationManager");
const ApiKeyManager_1 = require("../services/ApiKeyManager");
const AudioDeviceService_1 = require("../services/AudioDeviceService");
/**
 * Register all IPC handlers in the main process
 */
function registerIPCHandlers() {
    console.log('Registering IPC handlers...');
    // Audio device handlers
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.GET_DEVICES, handleGetAudioDevices);
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.START_CAPTURE, handleStartAudioCapture);
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.STOP_CAPTURE, handleStopAudioCapture);
    // Configuration handlers
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.GET_CONFIG, handleGetConfig);
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.SET_CONFIG, handleSetConfig);
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.VALIDATE_API_KEY, handleValidateApiKey);
    // Pipeline handlers
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.START_TRANSLATION, handleStartTranslation);
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.STOP_TRANSLATION, handleStopTranslation);
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.TEST_TRANSLATION, handleTestTranslation);
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.GET_STATUS, handleGetTranslationStatus);
    // Service status handlers
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.GET_SERVICE_STATUS, handleGetServiceStatus);
    // Debug handlers
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.GET_LOGS, handleGetLogs);
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.CLEAR_LOGS, handleClearLogs);
    // Performance handlers
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.GET_METRICS, handleGetMetrics);
    // Voice handlers
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.GET_VOICES, handleGetVoices);
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.START_VOICE_CLONING, handleStartVoiceCloning);
    console.log('IPC handlers registered successfully');
}
/**
 * Unregister all IPC handlers
 */
function unregisterIPCHandlers() {
    console.log('Unregistering IPC handlers...');
    // Remove all handlers
    Object.values(channels_1.IPC_CHANNELS).forEach(channel => {
        electron_1.ipcMain.removeAllListeners(channel);
    });
    console.log('IPC handlers unregistered');
}
// Handler implementations (placeholder implementations for now)
async function handleGetAudioDevices(event, request) {
    console.log('Handling get audio devices request');
    try {
        const audioDeviceService = new AudioDeviceService_1.AudioDeviceService();
        const deviceInfos = await audioDeviceService.getAvailableDevices();
        // Convert AudioDeviceInfo to AudioDevice format
        const devices = deviceInfos
            .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
            .map(device => ({
            deviceId: device.deviceId,
            label: device.label,
            kind: device.kind,
            groupId: device.groupId
        }));
        return {
            id: request.id,
            timestamp: Date.now(),
            success: true,
            payload: devices
        };
    }
    catch (error) {
        console.error('Error getting audio devices:', error);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            payload: []
        };
    }
}
async function handleStartAudioCapture(event, request) {
    console.log('Handling start audio capture request', request.payload);
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true
    };
}
async function handleStopAudioCapture(event, request) {
    console.log('Handling stop audio capture request');
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true
    };
}
async function handleGetConfig(event, request) {
    console.log('Handling get config request');
    try {
        const configManager = ConfigurationManager_1.ConfigurationManager.getInstance();
        const config = configManager.getConfig();
        return {
            id: request.id,
            timestamp: Date.now(),
            success: true,
            payload: config
        };
    }
    catch (error) {
        console.error('Error getting configuration:', error);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function handleSetConfig(event, request) {
    console.log('Handling set config request', request.payload);
    try {
        const configManager = ConfigurationManager_1.ConfigurationManager.getInstance();
        configManager.updateConfig(request.payload);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: true
        };
    }
    catch (error) {
        console.error('Error setting configuration:', error);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function handleValidateApiKey(event, request) {
    console.log('Handling validate API key request', request.payload.service);
    try {
        const apiKeyManager = ApiKeyManager_1.ApiKeyManager.getInstance();
        const result = await apiKeyManager.validateApiKey(request.payload.service, request.payload.apiKey);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: true,
            payload: result
        };
    }
    catch (error) {
        console.error('Error validating API key:', error);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function handleStartTranslation(event, request) {
    console.log('Handling start translation request', request.payload);
    try {
        // For now, we'll simulate starting the translation
        // In a full implementation, this would initialize the ProcessingOrchestrator
        console.log(`Starting translation: ${request.payload.microphoneId} -> ${request.payload.targetLanguage}`);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: true,
            payload: { status: 'started' }
        };
    }
    catch (error) {
        console.error('Error starting translation:', error);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function handleStopTranslation(event, request) {
    console.log('Handling stop translation request');
    try {
        // For now, we'll simulate stopping the translation
        console.log('Stopping translation');
        return {
            id: request.id,
            timestamp: Date.now(),
            success: true,
            payload: { status: 'stopped' }
        };
    }
    catch (error) {
        console.error('Error stopping translation:', error);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function handleGetServiceStatus(event, request) {
    console.log('Handling get service status request');
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true,
        payload: {
            speechToText: { available: false, status: 'unavailable' },
            translation: { available: false, status: 'unavailable' },
            textToSpeech: { available: false, status: 'unavailable' },
            virtualMicrophone: { available: false, status: 'unavailable' },
            audioCapture: { available: false, status: 'unavailable' }
        }
    };
}
async function handleGetLogs(event, request) {
    console.log('Handling get logs request');
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true,
        payload: []
    };
}
async function handleClearLogs(event, request) {
    console.log('Handling clear logs request');
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true
    };
}
async function handleGetMetrics(event, request) {
    console.log('Handling get metrics request');
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true,
        payload: {
            memory: { used: 0, total: 0, percentage: 0 },
            cpuUsage: 0,
            network: { bytesSent: 0, bytesReceived: 0, uploadSpeed: 0, downloadSpeed: 0, online: true },
            audioLatency: { endToEnd: 0, speechToText: 0, translation: 0, textToSpeech: 0, audioOutput: 0 },
            apiResponseTimes: {}
        }
    };
}
async function handleGetVoices(event, request) {
    console.log('🎤 Handling get voices request');
    try {
        const configManager = ConfigurationManager_1.ConfigurationManager.getInstance();
        const { TextToSpeechManager } = await Promise.resolve().then(() => __importStar(require('../services/TextToSpeechManager')));
        const ttsService = new TextToSpeechManager(configManager);
        if (ttsService.isAvailable()) {
            const voices = await ttsService.getAvailableVoices();
            console.log(`✅ Found ${voices.length} voices from ElevenLabs`);
            return {
                id: request.id,
                timestamp: Date.now(),
                success: true,
                payload: voices
            };
        }
        else {
            console.log('⚠️ TTS service not available, returning empty list');
            return {
                id: request.id,
                timestamp: Date.now(),
                success: true,
                payload: []
            };
        }
    }
    catch (error) {
        console.error('❌ Error getting voices:', error);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            payload: []
        };
    }
}
async function handleStartVoiceCloning(event, request) {
    console.log('Handling start voice cloning request');
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true
    };
}
async function handleTestTranslation(event, request) {
    console.log('🧪 Handling test translation request:', request.payload);
    try {
        const { text, targetLanguage, voiceId, outputToHeadphones } = request.payload;
        // Initialize services
        console.log('📋 Initializing services...');
        const configManager = ConfigurationManager_1.ConfigurationManager.getInstance();
        const config = configManager.getConfig();
        // Check API keys
        console.log('🔑 Checking API keys...');
        if (!config.apiKeys.openai || config.apiKeys.openai.trim().length === 0) {
            throw new Error('OpenAI API key is not configured');
        }
        if (!config.apiKeys.elevenlabs || config.apiKeys.elevenlabs.trim().length === 0) {
            throw new Error('ElevenLabs API key is not configured');
        }
        console.log('✅ API keys are configured');
        const { TranslationServiceManager } = await Promise.resolve().then(() => __importStar(require('../services/TranslationServiceManager')));
        const { TextToSpeechManager } = await Promise.resolve().then(() => __importStar(require('../services/TextToSpeechManager')));
        const { VirtualMicrophoneManager } = await Promise.resolve().then(() => __importStar(require('../services/VirtualMicrophoneManager')));
        const translationService = new TranslationServiceManager(configManager);
        const ttsService = new TextToSpeechManager(configManager);
        const virtualMic = new VirtualMicrophoneManager();
        // Test translation
        console.log(`🔄 Translating: "${text}" to ${targetLanguage}`);
        const translationResult = await translationService.translate(text, targetLanguage, 'en');
        console.log(`✅ Translation result: "${translationResult.translatedText}"`);
        // Test text-to-speech
        console.log(`🎤 Synthesizing speech with voice: ${voiceId}`);
        const audioBuffer = await ttsService.synthesize(translationResult.translatedText, voiceId);
        console.log(`✅ TTS synthesis complete: ${audioBuffer.byteLength} bytes`);
        // Output audio
        console.log(`🔊 Playing audio (headphones: ${outputToHeadphones})`);
        try {
            if (outputToHeadphones) {
                // For test mode, play directly to system audio (headphones)
                await virtualMic.playAudio({ audioBuffer });
            }
            else {
                // For real-time mode, send to virtual microphone
                await virtualMic.sendAudio(audioBuffer);
            }
            console.log('✅ Audio playback initiated');
        }
        catch (audioError) {
            const errorMessage = audioError instanceof Error ? audioError.message : 'Unknown audio error';
            console.warn('⚠️ Audio playback failed, but translation was successful:', errorMessage);
            // Don't fail the entire test just because audio playback failed
            // The translation part worked (as evidenced by OpenAI token usage)
        }
        return {
            id: request.id,
            timestamp: Date.now(),
            success: true,
            payload: {
                originalText: text,
                translatedText: translationResult.translatedText,
                audioGenerated: true,
                audioBuffer: outputToHeadphones ? Array.from(new Uint8Array(audioBuffer)) : null
            }
        };
    }
    catch (error) {
        console.error('❌ Test translation failed:', error);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
async function handleGetTranslationStatus(event, request) {
    console.log('Handling get translation status request');
    try {
        // For now, return a mock status
        // In a full implementation, this would get status from ProcessingOrchestrator
        const status = {
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
        return {
            id: request.id,
            timestamp: Date.now(),
            success: true,
            payload: status
        };
    }
    catch (error) {
        console.error('Error getting translation status:', error);
        return {
            id: request.id,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
//# sourceMappingURL=handlers.js.map