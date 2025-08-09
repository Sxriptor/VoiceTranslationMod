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
  
  // Speech-to-text handlers
  ipcMain.handle(IPC_CHANNELS.TRANSCRIBE, handleSpeechTranscription);
  ipcMain.handle(IPC_CHANNELS.TRANSCRIBE_PUSH_TO_TALK, handlePushToTalkTranscription);
  ipcMain.handle('audio:stream', handleAudioStream);

  // Translation-only and TTS-only handlers
  ipcMain.handle(IPC_CHANNELS.TRANSLATE_ONLY, handleTranslateOnly);
  ipcMain.handle(IPC_CHANNELS.SYNTHESIZE_ONLY, handleSynthesizeOnly);

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

  // Bidirectional logging and state (renderer → main for terminal visibility)
  ipcMain.handle('bidirectional:state', async (event: IpcMainInvokeEvent, request: IPCRequest<{ action: string; details?: any }>) => {
    try {
      const { action, details } = request.payload || { action: 'unknown' };
      console.log(`[Bidirectional] ${action}`, details || '');
      return { id: request.id, timestamp: Date.now(), success: true };
    } catch (error) {
      return { id: request.id, timestamp: Date.now(), success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
  ipcMain.handle('bidirectional:log', async (event: IpcMainInvokeEvent, request: IPCRequest<{ level?: 'info'|'warn'|'error'; message: string; data?: any }>) => {
    try {
      const { level = 'info', message, data } = request.payload || { message: '' };
      const tag = level.toUpperCase();
      if (level === 'error') console.error(`[Bidirectional][${tag}] ${message}`, data || '');
      else if (level === 'warn') console.warn(`[Bidirectional][${tag}] ${message}`, data || '');
      else console.log(`[Bidirectional][${tag}] ${message}`, data || '');
      return { id: request.id, timestamp: Date.now(), success: true };
    } catch (error) {
      return { id: request.id, timestamp: Date.now(), success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  console.log('IPC handlers registered successfully');
}

/**
 * Unregister all IPC handlers
 */
export function unregisterIPCHandlers(): void {
  console.log('Unregistering IPC handlers...');
  
  // Remove all handlers
  Object.values(IPC_CHANNELS).forEach(channel => {
    ipcMain.removeHandler(channel as any);
    ipcMain.removeAllListeners(channel);
  });

  console.log('IPC handlers unregistered');
}

// Minimal translate-only handler to ensure only translated text is returned
async function handleTranslateOnly(
  event: IpcMainInvokeEvent,
  request: IPCRequest<{ text: string; targetLanguage: string; sourceLanguage?: string }>
): Promise<IPCResponse<{ translatedText: string }>> {
  try {
    const configManager = ConfigurationManager.getInstance();
    const { TranslationServiceManager } = await import('../services/TranslationServiceManager');
    const translationService = new TranslationServiceManager(configManager);
    const result = await translationService.translate(
      request.payload.text,
      request.payload.targetLanguage,
      request.payload.sourceLanguage || 'en'
    );
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: { translatedText: result.translatedText }
    };
  } catch (error) {
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Minimal synthesize-only handler that speaks exactly the provided text
async function handleSynthesizeOnly(
  event: IpcMainInvokeEvent,
  request: IPCRequest<{ text: string; voiceId: string }>
): Promise<IPCResponse<{ audioBuffer: number[] }>> {
  try {
    const configManager = ConfigurationManager.getInstance();
    const { TextToSpeechManager } = await import('../services/TextToSpeechManager');
    const ttsService = new TextToSpeechManager(configManager);
    const audioBuffer = await ttsService.synthesize(request.payload.text, request.payload.voiceId);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: { audioBuffer: Array.from(new Uint8Array(audioBuffer)) }
    };
  } catch (error) {
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
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

// Global processing orchestrator instance
let processingOrchestrator: any = null;

// Prevent feedback loops and concurrent processing
let lastTranslatedText = '';
let lastInputText = '';
let lastTranslationTime = 0;
let isProcessingTranslation = false; // Lock to prevent concurrent processing
const TRANSLATION_COOLDOWN = 10000; // 10 seconds cooldown (increased)
const MIN_TEXT_LENGTH = 5; // Minimum text length to process
let recentTranscriptions: string[] = []; // Track recent transcriptions to prevent loops
let lastProcessingTime = 0; // Track when we last processed audio

// Audio stream handler for real-time processing
async function handleAudioStream(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<{ audioData: number[]; sampleRate: number; timestamp: number }>
): Promise<IPCResponse<void>> {
  try {
    if (!processingOrchestrator || !processingOrchestrator.isActive) {
      // Not actively translating, ignore audio
      return {
        id: request.id,
        timestamp: Date.now(),
        success: true
      };
    }
    
    const { audioData, sampleRate, timestamp } = request.payload;
    
    // Convert audio data to the format expected by our services
    const audioBuffer = new Float32Array(audioData);
    
    // Create audio segment
    const audioSegment = {
      id: `stream_${Date.now()}`,
      data: audioBuffer,
      sampleRate: sampleRate || 16000,
      channelCount: 1,
      duration: audioBuffer.length / (sampleRate || 16000),
      timestamp: timestamp
    };
    
    // Process the audio segment through the pipeline
    await processRealTimeAudio(audioSegment);
    
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true
    };
    
  } catch (error) {
    console.error('❌ Audio stream processing error:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Process real-time audio with existing transcription
async function processRealTimeAudioWithTranscription(audioSegment: any, transcriptionText: string): Promise<void> {
  if (!processingOrchestrator || !processingOrchestrator.isActive) {
    return;
  }
  
  try {
    const config = processingOrchestrator.config;
    
    // Initialize services if not already done
    if (!processingOrchestrator.services) {
      const configManager = ConfigurationManager.getInstance();
      const { TranslationServiceManager } = await import('../services/TranslationServiceManager');
      const { TextToSpeechManager } = await import('../services/TextToSpeechManager');
      
      processingOrchestrator.services = {
        translation: new TranslationServiceManager(configManager),
        textToSpeech: new TextToSpeechManager(configManager)
      };
    }
    
    const services = processingOrchestrator.services;
    
    console.log(`📝 Using transcription: "${transcriptionText}"`);
    
    // Step 1: Translation
    const translationResult = await services.translation.translate(
      transcriptionText,
      config.targetLanguage,
      'en'
    );
    console.log(`🌐 Translated: "${translationResult.translatedText}"`);
    
    // Update feedback prevention tracking
    lastTranslatedText = translationResult.translatedText.replace(/["""]/g, '').trim();
    lastTranslationTime = Date.now();
    
    // Step 2: Text-to-Speech
    const audioBuffer = await services.textToSpeech.synthesize(
      translationResult.translatedText,
      config.voiceId
    );
    console.log(`🎵 Generated audio: ${audioBuffer.byteLength} bytes`);
    
    // Step 3: Output audio - send back to renderer for playback
    console.log('🔊 Sending translated audio to renderer for playback');
    
    // Send the audio back to the renderer process for playback
    // This allows the user to hear the translation in the app
    try {
      // Convert ArrayBuffer to regular array for IPC transmission
      const audioArray = Array.from(new Uint8Array(audioBuffer));
      
      // Send to all renderer processes (in case there are multiple windows)
      const { BrowserWindow } = await import('electron');
      const windows = BrowserWindow.getAllWindows();
      
      for (const window of windows) {
        if (!window.isDestroyed()) {
          window.webContents.send('realtime-audio-playback', {
            audioData: audioArray,
            originalText: transcriptionText,
            translatedText: translationResult.translatedText,
            outputToVirtualMic: config.outputToVirtualMic
          });
        }
      }
      
      console.log('✅ Audio sent to renderer for playback');
    } catch (error) {
      console.error('❌ Failed to send audio to renderer:', error);
    }
    
    console.log('✅ Real-time translation complete');
    
  } catch (error) {
    console.error('❌ Real-time translation error:', error);
  }
}

// Process real-time audio through the complete pipeline
async function processRealTimeAudio(audioSegment: any): Promise<void> {
  if (!processingOrchestrator || !processingOrchestrator.isActive) {
    return;
  }
  
  try {
    const config = processingOrchestrator.config;
    
    // Initialize services if not already done
    if (!processingOrchestrator.services) {
      const configManager = ConfigurationManager.getInstance();
      const { WhisperApiClient } = await import('../services/WhisperApiClient');
      const { ApiKeyManager } = await import('../services/ApiKeyManager');
      const { SpeechToTextService } = await import('../services/SpeechToTextService');
      const { TranslationServiceManager } = await import('../services/TranslationServiceManager');
      const { TextToSpeechManager } = await import('../services/TextToSpeechManager');
      
      const apiKeyManager = ApiKeyManager.getInstance();
      const whisperClient = new WhisperApiClient(apiKeyManager);
      
      processingOrchestrator.services = {
        speechToText: new SpeechToTextService(whisperClient),
        translation: new TranslationServiceManager(configManager),
        textToSpeech: new TextToSpeechManager(configManager),
        virtualMic: null // Will be created when needed
      };
    }
    
    const services = processingOrchestrator.services;
    
    // Step 1: Speech-to-Text
    console.log('🎤 Processing real-time audio segment...');
    const transcriptionResult = await services.speechToText.transcribe(audioSegment);
    
    if (!transcriptionResult.text || transcriptionResult.text.trim().length === 0) {
      // No speech detected, skip processing
      return;
    }
    
    console.log(`📝 Transcribed: "${transcriptionResult.text}"`);
    
    // Step 2: Translation
    const translationResult = await services.translation.translate(
      transcriptionResult.text,
      config.targetLanguage,
      'en'
    );
    console.log(`🌐 Translated: "${translationResult.translatedText}"`);
    
    // Step 3: Text-to-Speech
    const audioBuffer = await services.textToSpeech.synthesize(
      translationResult.translatedText,
      config.voiceId
    );
    console.log(`🎵 Generated audio: ${audioBuffer.byteLength} bytes`);
    
    // Step 4: Output audio
    console.log('🔊 Playing audio in main process (simulated virtual microphone)');
    
    // In the main process, we can't use AudioContext, so we'll just log the audio output
    // In a full implementation, this would be handled by the renderer process
    if (config.outputToVirtualMic) {
      console.log('🎤 Audio would be sent to virtual microphone');
    } else {
      console.log('🔊 Audio would be played to headphones');
    }
    
    console.log('✅ Real-time audio processing complete');
    
  } catch (error) {
    console.error('❌ Real-time audio processing error:', error);
  }
}

async function handleStartTranslation(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<{ microphoneId: string; targetLanguage: string; voiceId: string; outputToVirtualMic: boolean }>
): Promise<IPCResponse<{ status: string }>> {
  console.log('🚀 Handling start translation request', request.payload);
  
  try {
    const { microphoneId, targetLanguage, voiceId, outputToVirtualMic } = request.payload;
    
    // Initialize services
    console.log('📋 Initializing real-time translation services...');
    const configManager = ConfigurationManager.getInstance();
    const config = configManager.getConfig();
    
    // Check API keys
    if (!config.apiKeys.openai || config.apiKeys.openai.trim().length === 0) {
      throw new Error('OpenAI API key is not configured');
    }
    if (!config.apiKeys.elevenlabs || config.apiKeys.elevenlabs.trim().length === 0) {
      throw new Error('ElevenLabs API key is not configured');
    }
    
    // Don't initialize services here - they will be created lazily when needed
    // This prevents AudioContext errors in the main process
    
    // Store configuration for processing
    const processingConfig = {
      microphoneId,
      targetLanguage,
      voiceId,
      outputToVirtualMic
    };
    
    // Initialize the processing orchestrator for real-time audio
    console.log(`🎤 Starting real-time translation: ${microphoneId} -> ${targetLanguage}`);
    console.log('🔊 Audio will be captured from renderer process and streamed to main process');
    
    // Store the processing orchestrator
    processingOrchestrator = {
      config: processingConfig,
      isActive: true,
      services: null // Will be initialized when first audio arrives
    };
    
    console.log('✅ Real-time translation started successfully');
    
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: { status: 'started' }
    };
    
  } catch (error) {
    console.error('❌ Error starting translation:', error);
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
  console.log('🛑 Handling stop translation request');
  
  try {
    // Stop the real-time processing
    if (processingOrchestrator && processingOrchestrator.isActive) {
      console.log('🔄 Stopping real-time translation...');
      
      processingOrchestrator.isActive = false;
      processingOrchestrator = null;
      
      // Clear feedback prevention tracking
      lastTranslatedText = '';
      lastInputText = '';
      lastTranslationTime = 0;
      isProcessingTranslation = false;
      recentTranscriptions = [];
      
      console.log('✅ Real-time translation stopped and tracking cleared');
    } else {
      console.log('⚠️ No active translation to stop');
    }
    
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: { status: 'stopped' }
    };
  } catch (error) {
    console.error('❌ Error stopping translation:', error);
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
  
  // Add stack trace to debug where this is being called from
  const stack = new Error().stack;
  console.log('📍 Test translation call stack:', stack?.split('\n').slice(1, 4).join('\n'));
  
  // Allow test translation to work - it's used by push-to-talk functionality
  
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
    
    const translationService = new TranslationServiceManager(configManager);
    const ttsService = new TextToSpeechManager(configManager);
    
    // Test translation
    console.log(`🔄 Translating: "${text}" to ${targetLanguage}`);
    const translationResult = await translationService.translate(text, targetLanguage, 'en');
    console.log(`✅ Translation result: "${translationResult.translatedText}"`);
    
    // IMPORTANT: Only synthesize the translated text (never the English/original)
    console.log(`🎤 Synthesizing speech with voice: ${voiceId}`);
    const ttsInput = translationResult.translatedText;
    const audioBuffer = await ttsService.synthesize(ttsInput, voiceId);
    console.log(`✅ TTS synthesis complete: ${audioBuffer.byteLength} bytes`);
    
    // Do NOT push playback events from main. Return audio buffer and let renderer decide routing.
    // This avoids duplicate playback and potential feedback loops.
    
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: {
        originalText: text,
        translatedText: translationResult.translatedText,
        audioGenerated: true,
        audioBuffer: Array.from(new Uint8Array(audioBuffer))
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
  console.log('📊 Handling get translation status request');
  
  try {
    // Return actual status based on processing orchestrator
    const status = {
      isActive: processingOrchestrator ? processingOrchestrator.isActive : false,
      currentStep: processingOrchestrator ? 'listening' : 'idle',
      error: null,
      performance: {
        audioLatency: 0,
        sttLatency: 0,
        translationLatency: 0,
        ttsLatency: 0,
        totalLatency: 0
      },
      config: processingOrchestrator ? processingOrchestrator.config : null
    };
    
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: status
    };
  } catch (error) {
    console.error('❌ Error getting translation status:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleSpeechTranscription(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<{ audioData: number[]; language?: string; contentType?: string }>
): Promise<IPCResponse<{ text: string; language?: string; duration?: number }>> {
  console.log('🎤 Handling speech transcription request');
  
  try {
    const { audioData, language, contentType } = request.payload;
    
    // Initialize services
    console.log('📋 Initializing Whisper service...');
    const configManager = ConfigurationManager.getInstance();
    const config = configManager.getConfig();
    
    // Check OpenAI API key
    if (!config.apiKeys.openai || config.apiKeys.openai.trim().length === 0) {
      throw new Error('OpenAI API key is not configured');
    }
    
    const { WhisperApiClient } = await import('../services/WhisperApiClient');
    const { ApiKeyManager } = await import('../services/ApiKeyManager');
    
    const apiKeyManager = ApiKeyManager.getInstance();
    const whisperClient = new WhisperApiClient(apiKeyManager);
    
    // Convert audio data back to blob
    const audioBuffer = new Uint8Array(audioData).buffer;
    const audioBlob = new Blob([audioBuffer], { type: contentType || 'audio/webm' });
    
    console.log(`🎵 Transcribing audio: ${audioBlob.size} bytes`);
    
    // Use real Whisper API for transcription
    console.log('🔄 Sending audio to Whisper API...');
    const transcriptionResult = await whisperClient.transcribe({
      audio: audioBlob,
      language: language === 'auto' ? undefined : language,
      response_format: 'verbose_json',
      temperature: 0
    });
    
    console.log(`✅ Transcription successful: "${transcriptionResult.text}"`);
    
    // If we're in real-time translation mode, continue with the full pipeline
    // IMPORTANT: Do not call handleTestTranslation here to avoid recursion/looping
    if (processingOrchestrator && processingOrchestrator.isActive && transcriptionResult.text.trim().length > 0) {
      
      // Check if we're already processing a translation
      if (isProcessingTranslation) {
        console.log('🔒 Skipping processing - another translation is already in progress');
        return {
          id: request.id,
          timestamp: Date.now(),
          success: true,
          payload: {
            text: transcriptionResult.text,
            language: transcriptionResult.language,
            duration: transcriptionResult.duration
          }
        };
      }
      
      // Prevent feedback loops
      const currentTime = Date.now();
      const transcribedText = transcriptionResult.text.trim();
      
      // Skip very short utterances that are likely noise
      if (transcribedText.length < MIN_TEXT_LENGTH) {
        console.log(`🔇 Skipping short transcription (${transcribedText.length} chars): "${transcribedText}"`);
        return {
          id: request.id,
          timestamp: Date.now(),
          success: true,
          payload: {
            text: transcriptionResult.text,
            language: transcriptionResult.language,
            duration: transcriptionResult.duration
          }
        };
      }

      // Check if we're in cooldown period (more aggressive)
      const timeSinceLastTranslation = currentTime - lastTranslationTime;
      const timeSinceLastProcessing = currentTime - lastProcessingTime;
      
      if (lastTranslationTime > 0 && timeSinceLastTranslation < TRANSLATION_COOLDOWN) {
        console.log(`🔇 Skipping processing - translation cooldown active (${Math.round((TRANSLATION_COOLDOWN - timeSinceLastTranslation) / 1000)}s remaining)`);
        return {
          id: request.id,
          timestamp: Date.now(),
          success: true,
          payload: {
            text: transcriptionResult.text,
            language: transcriptionResult.language,
            duration: transcriptionResult.duration
          }
        };
      }
      
      // Also check for rapid processing attempts
      if (lastProcessingTime > 0 && timeSinceLastProcessing < 3000) {
        console.log(`🔇 Skipping processing - too soon since last processing (${Math.round((3000 - timeSinceLastProcessing) / 1000)}s remaining)`);
        return {
          id: request.id,
          timestamp: Date.now(),
          success: true,
          payload: {
            text: transcriptionResult.text,
            language: transcriptionResult.language,
            duration: transcriptionResult.duration
          }
        };
      }

      // Check if it's the same input text as last time
      if (lastInputText && transcribedText === lastInputText) {
        console.log('🔇 Skipping processing - same input text as last translation');
        return {
          id: request.id,
          timestamp: Date.now(),
          success: true,
          payload: {
            text: transcriptionResult.text,
            language: transcriptionResult.language,
            duration: transcriptionResult.duration
          }
        };
      }

      // Check if this text was recently processed (prevent loops)
      if (recentTranscriptions.includes(transcribedText)) {
        console.log('🔇 Skipping processing - text was recently processed');
        return {
          id: request.id,
          timestamp: Date.now(),
          success: true,
          payload: {
            text: transcriptionResult.text,
            language: transcriptionResult.language,
            duration: transcriptionResult.duration
          }
        };
      }

      // Check if this looks like our own translated output
      if (lastTranslatedText) {
        const cleanTranslated = lastTranslatedText.replace(/["""]/g, '').trim().toLowerCase();
        const cleanTranscribed = transcribedText.replace(/["""]/g, '').trim().toLowerCase();
        
        if (cleanTranscribed === cleanTranslated || 
            cleanTranscribed.includes(cleanTranslated) || 
            cleanTranslated.includes(cleanTranscribed)) {
          console.log('🔇 Skipping processing - likely feedback from our own output');
          return {
            id: request.id,
            timestamp: Date.now(),
            success: true,
            payload: {
              text: transcriptionResult.text,
              language: transcriptionResult.language,
              duration: transcriptionResult.duration
            }
          };
        }
      }
      
      console.log('🔄 Continuing with real-time translation pipeline...');
      
      // Set processing lock and update processing time
      isProcessingTranslation = true;
      lastProcessingTime = currentTime;
      
      try {
        // Process translation directly without calling test translation path
        console.log('🔄 Processing real-time translation directly (no test path)...');
        
        const { text, targetLanguage, voiceId } = {
          text: transcriptionResult.text,
          targetLanguage: processingOrchestrator.config.targetLanguage,
          voiceId: processingOrchestrator.config.voiceId
        };
        
        // Initialize services
        const configManager = ConfigurationManager.getInstance();
        const { TranslationServiceManager } = await import('../services/TranslationServiceManager');
        const { TextToSpeechManager } = await import('../services/TextToSpeechManager');
        
        const translationService = new TranslationServiceManager(configManager);
        const ttsService = new TextToSpeechManager(configManager);
        
        // Translate original text to target (ensure only translated text is used for TTS)
        console.log(`🔄 Translating: "${text}" to ${targetLanguage}`);
        const translationResult = await translationService.translate(text, targetLanguage, 'en');
        console.log(`✅ Translation result: "${translationResult.translatedText}"`);
        
        // Synthesize speech using translated text only
        console.log(`🎤 Synthesizing speech with voice: ${voiceId}`);
        const ttsInput = translationResult.translatedText;
        const audioBuffer = await ttsService.synthesize(ttsInput, voiceId);
        console.log(`✅ TTS synthesis complete: ${audioBuffer.byteLength} bytes`);
        
        // Send audio to renderer for playback - but mark it as real-time to prevent re-capture
        console.log(`🔊 Sending audio to renderer for playback (real-time mode)`);
        try {
          const audioArray = Array.from(new Uint8Array(audioBuffer));
          
          const { BrowserWindow } = await import('electron');
          const windows = BrowserWindow.getAllWindows();
          
          for (const window of windows) {
            if (!window.isDestroyed()) {
              // Use a different event name to distinguish from test playback
              window.webContents.send('realtime-translation-audio', {
                audioData: audioArray,
                originalText: text,
                translatedText: translationResult.translatedText,
                outputToVirtualMic: processingOrchestrator.config.outputToVirtualMic,
                isRealTime: true // Flag to prevent re-capture
              });
            }
          }
          
          console.log('✅ Audio sent to renderer for playback');
        } catch (audioError) {
          console.warn('⚠️ Audio sending failed:', audioError);
        }
        
        // Update feedback prevention tracking
        lastInputText = transcriptionResult.text.trim();
        lastTranslatedText = translationResult.translatedText.replace(/["""]/g, '').trim();
        lastTranslationTime = Date.now();
        
        // Add to recent transcriptions list (keep last 5)
        recentTranscriptions.push(lastInputText);
        if (recentTranscriptions.length > 5) {
          recentTranscriptions.shift();
        }
        
        console.log(`📝 Tracking - Input: "${lastInputText}" | Output: "${lastTranslatedText}"`);
        console.log('✅ Real-time translation completed successfully');
        
        // Add a longer pause before allowing new audio processing
        console.log('⏸️ Adding processing pause to prevent immediate re-processing');
        setTimeout(async () => {
          // Clear the audio capture to prevent re-processing
          console.log('🧹 Clearing audio capture to prevent re-processing');
          try {
            const { BrowserWindow } = await import('electron');
            const windows = BrowserWindow.getAllWindows();
            
            for (const window of windows) {
              if (!window.isDestroyed()) {
                // Tell renderer to clear its audio buffer and reset UI
                window.webContents.send('clear-audio-capture', {
                  reason: 'translation-completed'
                });
              }
            }
          } catch (clearError) {
            console.warn('⚠️ Failed to clear audio capture:', clearError);
          }
        }, 1000); // Wait 1 second before clearing to let audio finish playing
        
      } catch (translationError) {
        console.error('❌ Real-time translation error:', translationError);
      } finally {
        // Always clear the processing lock
        isProcessingTranslation = false;
      }
    }
    
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: {
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration
      }
    };
    
  } catch (error) {
    console.error('❌ Speech transcription failed:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handlePushToTalkTranscription(
  event: IpcMainInvokeEvent, 
  request: IPCRequest<{ audioData: number[]; language?: string }>
): Promise<IPCResponse<{ text: string; language?: string; duration?: number }>> {
  console.log('🎤 Handling push-to-talk transcription request');
  
  try {
    const { audioData, language } = request.payload;
    
    // Initialize services
    console.log('📋 Initializing Whisper service for push-to-talk...');
    const configManager = ConfigurationManager.getInstance();
    const config = configManager.getConfig();
    
    // Check OpenAI API key
    if (!config.apiKeys.openai || config.apiKeys.openai.trim().length === 0) {
      throw new Error('OpenAI API key is not configured');
    }
    
    const { WhisperApiClient } = await import('../services/WhisperApiClient');
    const { ApiKeyManager } = await import('../services/ApiKeyManager');
    
    const apiKeyManager = ApiKeyManager.getInstance();
    const whisperClient = new WhisperApiClient(apiKeyManager);
    
    // Convert audio data back to blob
    const audioBuffer = new Uint8Array(audioData).buffer;
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    
    console.log(`🎵 Transcribing push-to-talk audio: ${audioBlob.size} bytes`);
    
    // Use real Whisper API for transcription
    console.log('🔄 Sending audio to Whisper API...');
    const transcriptionResult = await whisperClient.transcribe({
      audio: audioBlob,
      language: language === 'auto' ? undefined : language,
      response_format: 'verbose_json',
      temperature: 0
    });
    
    console.log(`✅ Push-to-talk transcription successful: "${transcriptionResult.text}"`);
    
    // Return only the transcription - no real-time translation processing
    return {
      id: request.id,
      timestamp: Date.now(),
      success: true,
      payload: {
        text: transcriptionResult.text,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration
      }
    };
    
  } catch (error) {
    console.error('❌ Push-to-talk transcription failed:', error);
    return {
      id: request.id,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}