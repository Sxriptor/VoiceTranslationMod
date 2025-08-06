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
    }
});
//# sourceMappingURL=preload.js.map