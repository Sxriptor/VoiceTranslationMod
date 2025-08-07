"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // System information
    platform: process.platform,
    versions: process.versions,
    // IPC communication methods
    invoke: (channel, request) => {
        return electron_1.ipcRenderer.invoke(channel, request);
    },
    // Event listeners
    on: (channel, callback) => {
        electron_1.ipcRenderer.on(channel, callback);
    },
    off: (channel, callback) => {
        electron_1.ipcRenderer.off(channel, callback);
    },
    // Send messages without expecting a response
    send: (channel, ...args) => {
        electron_1.ipcRenderer.send(channel, ...args);
    },
    // Real-time audio playback listener
    onRealTimeAudioPlayback: null,
    // Set up real-time audio playback
    setupRealTimeAudioPlayback: (callback) => {
        electron_1.ipcRenderer.on('realtime-audio-playback', (event, data) => {
            callback(data);
        });
    },
    // Set up test audio playback
    setupTestAudioPlayback: (callback) => {
        electron_1.ipcRenderer.on('test-audio-playback', (event, data) => {
            callback(data);
        });
    },
    // Set up real-time translation audio playback
    setupRealTimeTranslationAudio: (callback) => {
        electron_1.ipcRenderer.on('realtime-translation-audio', (event, data) => {
            callback(data);
        });
    },
    // Set up clear audio capture listener
    setupClearAudioCapture: (callback) => {
        electron_1.ipcRenderer.on('clear-audio-capture', (event, data) => {
            callback(data);
        });
    }
});
//# sourceMappingURL=preload.js.map