/*
 * preload.js — Electron preload (context bridge)
 *
 * Exposes kbAPI to renderer via contextBridge.
 * This is the ONLY Node.js surface visible to the browser context.
 *
 * kbAPI surface (7 methods, all async):
 * ┌──────────────┬─────────────────────────────────────┬──────────────────┐
 * │ Method       │ Signature                           │ IPC Channel      │
 * ├──────────────┼─────────────────────────────────────┼──────────────────┤
 * │ listFiles    │ () => Promise<[{name, path, ...}]>  │ data:list-files  │
 * │ readFile     │ (path) => Promise<string|null>      │ data:read-file   │
 * │ getDataPath  │ () => Promise<string>               │ data:get-path    │
 * │ importFile   │ () => Promise<result|null>          │ data:import-file │
 * │ createFile   │ (name, content) => Promise<result>  │ data:create-file │
 * │ updateFile   │ (path, content) => Promise<result>  │ data:update-file │
 * │ deleteFile   │ (path) => Promise<result>           │ data:delete-file │
 * └──────────────┴─────────────────────────────────────┴──────────────────┘
 *
 * Safety: contextBridge only. No nodeIntegration. See main.js for channel details.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kbAPI', {
  listFiles: () => ipcRenderer.invoke('data:list-files'),
  readFile: (filePath) => ipcRenderer.invoke('data:read-file', filePath),
  getDataPath: () => ipcRenderer.invoke('data:get-path'),
  importFile: () => ipcRenderer.invoke('data:import-file'),
  createFile: (name, content) => ipcRenderer.invoke('data:create-file', name, content),
  updateFile: (filePath, content) => ipcRenderer.invoke('data:update-file', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('data:delete-file', filePath)
});
