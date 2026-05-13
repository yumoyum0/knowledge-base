/*
 * main.js — Electron main process
 *
 * IPC Channel Contract (7 channels):
 * ┌──────────────────────┬──────────────────────────────────┬─────────────────────────────┐
 * │ Channel              │ Signature                        │ Returns                     │
 * ├──────────────────────┼──────────────────────────────────┼─────────────────────────────┤
 * │ data:list-files      │ ()                               │ [{name, path, ...meta}]     │
 * │ data:read-file       │ (filePath: string)               │ string | null               │
 * │ data:get-path        │ ()                               │ string (dataDir absolute)   │
 * │ data:create-file     │ (name: string, content: string)  │ {name, path} | {error}      │
 * │ data:update-file     │ (filePath: string, content: str) │ {success} | {error}         │
 * │ data:delete-file     │ (filePath: string)               │ {success} | {error}         │
 * │ data:import-file     │ ()                               │ {name, path, size, ...} | null │
 * └──────────────────────┴──────────────────────────────────┴─────────────────────────────┘
 *
 * Safety rules:
 * - create-file / import-file: sanitizes name via path.basename(), rejects non-.txt/.md
 * - update-file / delete-file: validate resolved path stays within dataDir
 * - read-file: path not validated (renderer passes path from list-files result)
 * - contextIsolation: true, nodeIntegration: false (never relax)
 *
 * Window: 1100x700, min 800x500, title "Knowledge Base"
 * Data: ./data/ (created on first launch if missing)
 * Metadata: data/documents-meta.json
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const META_PATH = path.join(dataDir, 'documents-meta.json');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// --- Metadata helpers ---
function loadMeta() {
  try {
    if (fs.existsSync(META_PATH)) {
      return JSON.parse(fs.readFileSync(META_PATH, 'utf-8'));
    }
  } catch { /* corrupt or empty */ }
  return {};
}

function saveMeta(meta) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf-8');
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Knowledge Base'
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

// IPC: list files in data directory (includes metadata)
ipcMain.handle('data:list-files', async () => {
  try {
    const meta = loadMeta();
    const entries = fs.readdirSync(dataDir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && (e.name.endsWith('.txt') || e.name.endsWith('.md')))
      .map(e => {
        const filePath = path.join(dataDir, e.name);
        const stat = fs.statSync(filePath);
        return {
          name: e.name,
          path: filePath,
          size: stat.size,
          importDate: meta[e.name] ? meta[e.name].importDate : stat.birthtime.toISOString(),
          indexed: meta[e.name] ? meta[e.name].indexed || false : false
        };
      });
  } catch {
    return [];
  }
});

// IPC: read a file's content
ipcMain.handle('data:read-file', async (_event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
});

// IPC: get data directory path
ipcMain.handle('data:get-path', async () => {
  return dataDir;
});

// IPC: import a file via native file picker
ipcMain.handle('data:import-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Document',
      filters: [
        { name: 'Documents', extensions: ['txt', 'md'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const sourcePath = result.filePaths[0];
    const stat = fs.statSync(sourcePath);

    if (stat.size > MAX_FILE_SIZE) {
      return { error: 'File exceeds 10 MB maximum size.' };
    }

    const ext = path.extname(sourcePath).toLowerCase();
    if (ext !== '.txt' && ext !== '.md') {
      return { error: 'Only .txt and .md files are supported.' };
    }

    const safeName = path.basename(sourcePath);
    const destPath = path.join(dataDir, safeName);

    if (fs.existsSync(destPath)) {
      return { error: `"${safeName}" already exists in the library.` };
    }

    fs.copyFileSync(sourcePath, destPath);

    // Record metadata
    const meta = loadMeta();
    const importDate = new Date().toISOString();
    meta[safeName] = {
      originalPath: sourcePath,
      size: stat.size,
      importDate: importDate,
      indexed: false
    };
    saveMeta(meta);

    return {
      name: safeName,
      path: destPath,
      size: stat.size,
      importDate: importDate,
      indexed: false
    };
  } catch (_err) {
    return { error: _err.message };
  }
});

// IPC: create a new file
ipcMain.handle('data:create-file', async (_event, name, content) => {
  try {
    const safeName = path.basename(name);
    if (!safeName || (!safeName.endsWith('.txt') && !safeName.endsWith('.md'))) {
      return { error: 'Filename must end with .txt or .md' };
    }
    const filePath = path.join(dataDir, safeName);
    if (fs.existsSync(filePath)) {
      return { error: 'File already exists' };
    }
    fs.writeFileSync(filePath, content || '', 'utf-8');

    // Record metadata for new file
    const meta = loadMeta();
    if (!meta[safeName]) {
      meta[safeName] = {
        size: Buffer.byteLength(content || '', 'utf-8'),
        importDate: new Date().toISOString(),
        indexed: false
      };
      saveMeta(meta);
    }

    return { name: safeName, path: filePath };
  } catch (_err) {
    return { error: _err.message };
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

    // Update metadata size
    const meta = loadMeta();
    const name = path.basename(resolved);
    if (meta[name]) {
      meta[name].size = Buffer.byteLength(content, 'utf-8');
      saveMeta(meta);
    }

    return { success: true };
  } catch (_err) {
    return { error: _err.message };
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

    // Remove metadata
    const meta = loadMeta();
    const name = path.basename(resolved);
    if (meta[name]) {
      delete meta[name];
      saveMeta(meta);
    }

    return { success: true };
  } catch (_err) {
    return { error: _err.message };
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
