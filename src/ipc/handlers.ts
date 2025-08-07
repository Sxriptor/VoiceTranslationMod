import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from './channels';
import { 
  IPCRequest, 
  IPCResponse, 
  GetAudioDevicesRequest,
  GetAudioDevicesResponse,
  GetConfigRequest,
  GetConfigResponse,
  SetConfigRequest,
  ValidateApiKeyRequest,
  ValidateApiKeyResponse
} from './messages';
import { AudioQuality, TTSQuality, TranslationProvider } from '../types/ConfigurationTypes';
import { ConfigurationManager } from '../services/ConfigurationManager';
import { ApiKeyManager } from '../services/ApiKeyManager';
import { AudioDeviceService } from '../services/AudioDeviceService';

/**
 * Type-safe IPC handler function
 */
export type IPCHandler<TRequest extends IPCRequest, TResponse extends IPCResponse> = 
  (event: IpcMainInvokeEvent, request: TRequest) => Promise<TResponse> | TResponse;

/**
 * Register all IPC handlers in the main process
 */
export function registerIPCHandlers(): void {
  console.log('Registering IPC handlers...');

  // Audio device handlers
  ipcMain.handle(IPC_CHANNELS.GET_DEVICES, handleGetAudioDevices);
  ipcMain.handle(IPC_CHANNELS.START_CAPTURE, handleStartAudioCapture);
  ipcMain.handle(IPC_CHANNELS.STOP_CAPTURE, handleStopAudioCapture);

  // Configuration handlers
  ipcMain.handle(IPC_CHANNELS.GET_CONFIG, handleGetConfig);
  ipcMain.handle(IPC_CHANNELS.SET_CONFIG, handleSetConfig);
  ipcMain.handle(IPC_CHANNELS.VALIDATE_API_KEY, handleValidateApiKey);

  // Pipeline handlers
  ipcMain.handle(IPC_CHANNELS.START_TRANSLATION, handleStartTranslation);
  ipcMain.handle(IPC_CHANNELS.STOP_TRANSLATION, handleStopTranslation);
  ipcMain.handle(IPC_CHANNELS.TEST_TRANSLATION, handleTestTranslation);
  ipcMain.handle(IPC_CHANNELS.GET_STATUS, handleGetTranslationStatus);

  // Service status handlers
  ipcMain.handle(IPC_CHANNELS.GET_SERVICE_STATUS, handleGetServiceStatus);

  // Debug handlers
  ipcMain.handle(IPC_CHANNELS.GET_LOGS, handleGetLogs);
  ipcMain.handle(IPC_CHANNELS.CLEAR_LOGS, handleClearLogs);

  // Performance handlers
  ipcMain.handle(IPC_CHANNELS.GET_METRICS, handleGetMetrics);

  // Voice handlers
  ipcMain.handle(IPC_CHANNELS.GET_VOICES, handleGetVoices);
  ipcMain.handle(IPC_CHANNELS.START_VOICE_CLONING, handleStartVoiceCloning);

  console.log('IPC handlers registered successfully');
}

/**
 * Unregister all IPC handlers
 */
export function unregisterIPCHandlers(): void {
  console.log('Unregistering IPC handlers...');
  
  // Remove all handlers
  Object.values(IPC_CHANNELS).forEach(channel => {
    ipcMain.removeAllListeners(channel);
  });

  console.log('IPC handlers unregistered');
}

// Handler implementations (placeholder implementations for now)

async function handleGetAudioDevices(
  event: IpcMainInvokeEvent, 
  request: GetAudioDevicesRequest
): Promise<GetAudioDevicesResponse> {
  console.log('Handling get audio devices request');
  
  try {
    const audioDeviceService = new AudioDeviceService();
    const deviceInfos = await audioDeviceService.getAvailableDevices();
    
    // Convert AudioDeviceInfo to AudioDevice format
    const devices = deviceInfos
      .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label,
        kind: device.kind as 'audioinput' | 'audiooutput',
        groupId: device.groupId
      }));
    
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: devices
    };
  } catch (error) {
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

async function handleStartAudioCapture(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<{ deviceId: string }>
): Promise<IPCResponse<void>> {
  console.log('Handling start audio capture request', request.payload);
  
  // Placeholder implementation
  return {
    id: request.id,
    timestamp: Date.now(),
    success: true
  };
}

async function handleStopAudioCapture(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<void>
): Promise<IPCResponse<void>> {
  console.log('Handling stop audio capture request');
  
  // Placeholder implementation
  return {
    id: request.id,
    timestamp: Date.now(),
    success: true
  };
}

async function handleGetConfig(
  event: IpcMainInvokeEvent, 
  request: GetConfigRequest
): Promise<GetConfigResponse> {
  console.log('Handling get config request');
  
  try {
    const configManager = ConfigurationManager.getInstance();
    const config = configManager.getConfig();

    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: config
    };
  } catch (error) {
    console.error('Error getting configuration:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleSetConfig(
  event: IpcMainInvokeEvent, 
  request: SetConfigRequest
): Promise<IPCResponse<void>> {
  console.log('Handling set config request', request.payload);
  
  try {
    const configManager = ConfigurationManager.getInstance();
    configManager.updateConfig(request.payload);

    return {
      id: request.id,
      timestamp: Date.now(),
      success: true
    };
  } catch (error) {
    console.error('Error setting configuration:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleValidateApiKey(
  event: IpcMainInvokeEvent, 
  request: ValidateApiKeyRequest
): Promise<ValidateApiKeyResponse> {
  console.log('Handling validate API key request', request.payload.service);
  
  try {
    const apiKeyManager = ApiKeyManager.getInstance();
    const result = await apiKeyManager.validateApiKey(request.payload.service, request.payload.apiKey);

    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: result
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleStartTranslation(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<{ microphoneId: string; targetLanguage: string; voiceId: string; outputToVirtualMic: boolean }>
): Promise<IPCResponse<{ status: string }>> {
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
  } catch (error) {
    console.error('Error starting translation:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleStopTranslation(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<void>
): Promise<IPCResponse<{ status: string }>> {
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
  } catch (error) {
    console.error('Error stopping translation:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleGetServiceStatus(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<void>
): Promise<IPCResponse<any>> {
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

async function handleGetLogs(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<any>
): Promise<IPCResponse<any[]>> {
  console.log('Handling get logs request');
  
  // Placeholder implementation
  return {
    id: request.id,
    timestamp: Date.now(),
    success: true,
    payload: []
  };
}

async function handleClearLogs(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<void>
): Promise<IPCResponse<void>> {
  console.log('Handling clear logs request');
  
  // Placeholder implementation
  return {
    id: request.id,
    timestamp: Date.now(),
    success: true
  };
}

async function handleGetMetrics(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<void>
): Promise<IPCResponse<any>> {
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

async function handleGetVoices(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<void>
): Promise<IPCResponse<any[]>> {
  console.log('🎤 Handling get voices request');
  
  try {
    const configManager = ConfigurationManager.getInstance();
    const { TextToSpeechManager } = await import('../services/TextToSpeechManager');
    
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
    } else {
      console.log('⚠️ TTS service not available, returning empty list');
      return {
        id: request.id,
        timestamp: Date.now(),
        success: true,
        payload: []
      };
    }
  } catch (error) {
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

async function handleStartVoiceCloning(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<any>
): Promise<IPCResponse<void>> {
  console.log('Handling start voice cloning request');
  
  // Placeholder implementation
  return {
    id: request.id,
    timestamp: Date.now(),
    success: true
  };
}

async function handleTestTranslation(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<{ text: string; targetLanguage: string; voiceId: string; outputToHeadphones: boolean }>
): Promise<IPCResponse<{ originalText: string; translatedText: string; audioGenerated: boolean; audioBuffer?: number[] | null }>> {
  console.log('🧪 Handling test translation request:', request.payload);
  
  try {
    const { text, targetLanguage, voiceId, outputToHeadphones } = request.payload;
    
    // Initialize services
    console.log('📋 Initializing services...');
    const configManager = ConfigurationManager.getInstance();
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
    
    const { TranslationServiceManager } = await import('../services/TranslationServiceManager');
    const { TextToSpeechManager } = await import('../services/TextToSpeechManager');
    const { VirtualMicrophoneManager } = await import('../services/VirtualMicrophoneManager');
    
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
      } else {
        // For real-time mode, send to virtual microphone
        await virtualMic.sendAudio(audioBuffer);
      }
      console.log('✅ Audio playback initiated');
    } catch (audioError) {
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
  } catch (error) {
    console.error('❌ Test translation failed:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleGetTranslationStatus(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<void>
): Promise<IPCResponse<any>> {
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
  } catch (error) {
    console.error('Error getting translation status:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}