/*
 * PersistenceService.js — Low-level JSON/text file I/O
 *
 * Handles reading and writing of index metadata and chunk files.
 * All writes are atomic (write to temp, then rename).
 */

const fs = require('fs');
const path = require('path');

class PersistenceService {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.chunksDir = path.join(dataDir, 'chunks');
    this.indexDir = path.join(dataDir, 'index');
    this._ensureDirs();
  }

  _ensureDirs() {
    if (!fs.existsSync(this.chunksDir)) {
      fs.mkdirSync(this.chunksDir, { recursive: true });
    }
    if (!fs.existsSync(this.indexDir)) {
      fs.mkdirSync(this.indexDir, { recursive: true });
    }
  }

  // --- Chunk I/O ---
  readChunks(docName) {
    const chunkPath = this._chunkPath(docName);
    try {
      if (fs.existsSync(chunkPath)) {
        return JSON.parse(fs.readFileSync(chunkPath, 'utf-8'));
      }
    } catch { /* corrupt or empty */ }
    return null;
  }

  writeChunks(docName, chunks) {
    const chunkPath = this._chunkPath(docName);
    const tmpPath = chunkPath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(chunks, null, 2), 'utf-8');
    fs.renameSync(tmpPath, chunkPath);
  }

  deleteChunks(docName) {
    const chunkPath = this._chunkPath(docName);
    if (fs.existsSync(chunkPath)) {
      fs.unlinkSync(chunkPath);
    }
  }

  _chunkPath(docName) {
    return path.join(this.chunksDir, docName + '.json');
  }

  // --- Index metadata I/O ---
  readIndexMeta() {
    const metaPath = this._indexMetaPath();
    try {
      if (fs.existsSync(metaPath)) {
        return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      }
    } catch { /* corrupt or empty */ }
    return this._defaultIndexMeta();
  }

  writeIndexMeta(meta) {
    const metaPath = this._indexMetaPath();
    const tmpPath = metaPath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(meta, null, 2), 'utf-8');
    fs.renameSync(tmpPath, metaPath);
  }

  _indexMetaPath() {
    return path.join(this.indexDir, 'index-meta.json');
  }

  _defaultIndexMeta() {
    return {
      globalStatus: 'idle',
      lastIndexed: null,
      documents: {}
    };
  }
}

module.exports = PersistenceService;
