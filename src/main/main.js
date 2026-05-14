/*
 * main.js — Electron main process
 *
 * IPC Channel Contract (13 channels):
 * ┌───────────────────────────┬───────────────────────────────────┬─────────────────────────────┐
 * │ Channel                   │ Signature                         │ Returns                     │
 * ├───────────────────────────┼───────────────────────────────────┼─────────────────────────────┤
 * │ data:list-files           │ ()                                │ [{name, path, ...meta}]     │
 * │ data:read-file            │ (filePath: string)                │ string | null               │
 * │ data:get-path             │ ()                                │ string (dataDir absolute)   │
 * │ data:create-file          │ (name: string, content: string)   │ {name, path} | {error}      │
 * │ data:update-file          │ (filePath: string, content: str)  │ {success} | {error}         │
 * │ data:delete-file          │ (filePath: string)                │ {success} | {error}         │
 * │ data:import-file          │ ()                                │ {name, path, size, ...} | null │
 * │ indexing:start-single     │ (filePath, docName)               │ {success, chunks, status}   │
 * │ indexing:start-all        │ ()                                │ {success, results, status}  │
 * │ indexing:get-status       │ ()                                │ {globalStatus, documents}   │
 * │ indexing:get-chunks       │ (docName)                         │ [{id, text, charCount, ...}]│
 * └───────────────────────────┴───────────────────────────────────┴─────────────────────────────┘
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
 * Chunks: data/chunks/<doc>.json, Index meta: data/index/index-meta.json
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize services
const PersistenceService = require('../services/PersistenceService');
const IndexingService = require('../services/IndexingService');
const persistence = new PersistenceService(dataDir);
const indexingService = new IndexingService(persistence);
const QaService = require("../services/QaService");
const qaService = new QaService(persistence, indexingService);
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
      return { error: '"' + safeName + '" already exists in the library.' };
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
  } catch { return { error: 'Failed to read index status' };
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
  } catch { return { error: 'Failed to read index status' };
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
  } catch { return { error: 'Failed to read index status' };
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

    // Remove index data
    indexingService.removeDocument(name);

    return { success: true };
  } catch { return { error: 'Failed to read index status' };
  }
});

// --- IPC: Indexing ---

// Index a single document
ipcMain.handle('indexing:start-single', async (_event, filePath, docName) => {
  try {
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(dataDir)) {
      return { error: 'Access denied' };
    }
    if (!fs.existsSync(resolved)) {
      return { error: 'File not found' };
    }

    // Update status to indexing
    let indexMeta = persistence.readIndexMeta();
    indexMeta.globalStatus = 'indexing';
    indexMeta.documents[docName] = { status: 'indexing', chunkCount: 0, lastIndexed: null };
    persistence.writeIndexMeta(indexMeta);

    const content = fs.readFileSync(resolved, 'utf-8');
    const chunks = indexingService.indexDocument(docName, content);

    // Update document metadata
    const meta = loadMeta();
    if (meta[docName]) {
      meta[docName].indexed = true;
      saveMeta(meta);
    }

    // Get updated status
    indexMeta = persistence.readIndexMeta();
    return { success: true, chunks: chunks, status: indexMeta };
  } catch (_err) {
    // Record error in index meta
    const indexMeta = persistence.readIndexMeta();
    indexMeta.documents[docName] = { status: 'error', error: _err.message };
    indexMeta.globalStatus = 'error';
    persistence.writeIndexMeta(indexMeta);
    return { error: _err.message };
  }
});

// Index all documents
ipcMain.handle('indexing:start-all', async () => {
  try {
    // Update status to indexing
    let indexMeta = persistence.readIndexMeta();
    indexMeta.globalStatus = 'indexing';
    persistence.writeIndexMeta(indexMeta);

    const entries = fs.readdirSync(dataDir, { withFileTypes: true });
    const docs = entries
      .filter(e => e.isFile() && (e.name.endsWith('.txt') || e.name.endsWith('.md')));

    const results = [];
    for (const doc of docs) {
      try {
        const filePath = path.join(dataDir, doc.name);
        const content = fs.readFileSync(filePath, 'utf-8');
        const chunks = indexingService.indexDocument(doc.name, content);

        const meta = loadMeta();
        if (meta[doc.name]) {
          meta[doc.name].indexed = true;
          saveMeta(meta);
        }

        results.push({ name: doc.name, chunkCount: chunks.length, error: null });
      } catch (err) {
        results.push({ name: doc.name, chunkCount: 0, error: err.message });
      }
    }

    indexMeta = persistence.readIndexMeta();
    return { success: true, results: results, status: indexMeta };
  } catch { return { error: 'Failed to read index status' };
  }
});

// Get index status
ipcMain.handle('indexing:get-status', async () => {
  try {
    return persistence.readIndexMeta();
  } catch { return { error: 'Failed to read index status' };
  }
});

// Get chunks for a document
ipcMain.handle('indexing:get-chunks', async (_event, docName) => {
  try {
    const chunks = indexingService.getChunks(docName);
    return chunks || [];
  } catch { return [];
  }
});

// IPC: Q&A -- ask a question
ipcMain.handle("qa:ask", async (_event, question) => {
  try {
    return qaService.ask(question);
  } catch { return { error: "Failed to process question" }; }
});

// IPC: Q&A -- get history
ipcMain.handle("qa:get-history", async () => {
  try {
    return qaService.getHistory();
  } catch { return []; }
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


