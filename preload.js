const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kbAPI', {
  listFiles: () => ipcRenderer.invoke('data:list-files'),
  readFile: (filePath) => ipcRenderer.invoke('data:read-file', filePath),
  getDataPath: () => ipcRenderer.invoke('data:get-path'),
  createFile: (name, content) => ipcRenderer.invoke('data:create-file', name, content),
  updateFile: (filePath, content) => ipcRenderer.invoke('data:update-file', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('data:delete-file', filePath)
});
