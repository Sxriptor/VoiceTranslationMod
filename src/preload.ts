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
  }
});