const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Knowledge Base'
  });

  mainWindow.loadFile('index.html');
}

// IPC: list files in data directory
ipcMain.handle('data:list-files', async () => {
  try {
    const entries = fs.readdirSync(dataDir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && (e.name.endsWith('.txt') || e.name.endsWith('.md')))
      .map(e => ({ name: e.name, path: path.join(dataDir, e.name) }));
  } catch (err) {
    return [];
  }
});

// IPC: read a file's content
ipcMain.handle('data:read-file', async (_event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return null;
  }
});

// IPC: get data directory path
ipcMain.handle('data:get-path', async () => {
  return dataDir;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
