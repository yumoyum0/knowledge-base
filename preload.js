const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kbAPI', {
  listFiles: () => ipcRenderer.invoke('data:list-files'),
  readFile: (filePath) => ipcRenderer.invoke('data:read-file', filePath),
  getDataPath: () => ipcRenderer.invoke('data:get-path')
});
