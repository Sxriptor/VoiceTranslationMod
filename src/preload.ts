import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System information
  platform: process.platform,
  versions: process.versions,

  // IPC communication methods
  invoke: (channel: string, request: any): Promise<any> => {
    return ipcRenderer.invoke(channel, request);
  },

  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },

  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.off(channel, callback);
  },

  // Send messages without expecting a response
  send: (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
  },

  // Real-time audio playback listener
  onRealTimeAudioPlayback: null as ((data: any) => void) | null,

  // Set up real-time audio playback
  setupRealTimeAudioPlayback: (callback: (data: any) => void) => {
    ipcRenderer.on('realtime-audio-playback', (event, data) => {
      callback(data);
    });
  },

  // Set up test audio playback
  setupTestAudioPlayback: (callback: (data: any) => void) => {
    ipcRenderer.on('test-audio-playback', (event, data) => {
      callback(data);
    });
  },

  // Set up real-time translation audio playback
  setupRealTimeTranslationAudio: (callback: (data: any) => void) => {
    ipcRenderer.on('realtime-translation-audio', (event, data) => {
      callback(data);
    });
  },

  // Set up clear audio capture listener
  setupClearAudioCapture: (callback: (data: any) => void) => {
    ipcRenderer.on('clear-audio-capture', (event, data) => {
      callback(data);
    });
  }
});