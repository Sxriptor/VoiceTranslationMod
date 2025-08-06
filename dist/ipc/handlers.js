"use strict";
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
    console.log('Handling start translation request');
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true
    };
}
async function handleStopTranslation(event, request) {
    console.log('Handling stop translation request');
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true
    };
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
    console.log('Handling get voices request');
    // Placeholder implementation
    return {
        id: request.id,
        timestamp: Date.now(),
        success: true,
        payload: []
    };
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
//# sourceMappingURL=handlers.js.map