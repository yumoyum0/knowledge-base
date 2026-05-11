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

// IPC: create a new file
ipcMain.handle('data:create-file', async (_event, name, content) => {
  try {
    const safeName = path.basename(name); // prevent path traversal
    if (!safeName || (!safeName.endsWith('.txt') && !safeName.endsWith('.md'))) {
      return { error: 'Filename must end with .txt or .md' };
    }
    const filePath = path.join(dataDir, safeName);
    if (fs.existsSync(filePath)) {
      return { error: 'File already exists' };
    }
    fs.writeFileSync(filePath, content || '', 'utf-8');
    return { name: safeName, path: filePath };
  } catch (err) {
    return { error: err.message };
  }
});

// IPC: update a file's content
ipcMain.handle('data:update-file', async (_event, filePath, content) => {
  try {
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(dataDir)) {
      return { error: 'Access denied' };
    }
    if (!fs.existsSync(resolved)) {
      return { error: 'File not found' };
    }
    fs.writeFileSync(resolved, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// IPC: delete a file
ipcMain.handle('data:delete-file', async (_event, filePath) => {
  try {
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(dataDir)) {
      return { error: 'Access denied' };
    }
    if (!fs.existsSync(resolved)) {
      return { error: 'File not found' };
    }
    fs.unlinkSync(resolved);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
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
