/*
 * IndexingService.js — Paragraph-aware text chunking
 *
 * Splits document text into ~500-character chunks at paragraph boundaries.
 * Chunks stored with metadata (character count, word count).
 * Tracks indexing status per document and globally via PersistenceService.
 */

class IndexingService {
  constructor(persistenceService) {
    this.persistence = persistenceService;
  }

  // --- Public API ---

  /**
   * Index a single document by name and content.
   * Returns the array of chunks created.
   */
  indexDocument(docName, content) {
    const chunks = this._chunkText(content, docName);
    this.persistence.writeChunks(docName, chunks);

    // Update index metadata
    const meta = this.persistence.readIndexMeta();
    meta.documents[docName] = {
      status: 'indexed',
      chunkCount: chunks.length,
      lastIndexed: new Date().toISOString()
    };
    this._updateGlobalStatus(meta);
    this.persistence.writeIndexMeta(meta);

    return chunks;
  }

  /**
   * Get stored chunks for a document.
   */
  getChunks(docName) {
    return this.persistence.readChunks(docName);
  }

  /**
   * Get current global index status.
   */
  getStatus() {
    return this.persistence.readIndexMeta();
  }

  /**
   * Remove index data for a document.
   */
  removeDocument(docName) {
    this.persistence.deleteChunks(docName);
    const meta = this.persistence.readIndexMeta();
    delete meta.documents[docName];
    this._updateGlobalStatus(meta);
    this.persistence.writeIndexMeta(meta);
  }

  // --- Chunking ---

  /**
   * Split text into ~500-character chunks at paragraph boundaries.
   * Max chunk size: ~500 chars. Min: any remaining text.
   * If a single paragraph exceeds 500 chars, split at sentence boundaries.
   */
  _chunkText(text, docName) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const paragraphs = text.split(/\n\n+/);
    const chunks = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length === 0) continue;

      // If adding this paragraph would exceed ~500 chars, flush current chunk
      if (currentChunk.length > 0 && currentChunk.length + trimmed.length + 1 > 500) {
        chunks.push(this._buildChunk(currentChunk, docName, chunkIndex));
        chunkIndex++;
        currentChunk = '';
      }

      if (trimmed.length > 500) {
        // Single paragraph is too large — split at sentence boundaries
        if (currentChunk.length > 0) {
          chunks.push(this._buildChunk(currentChunk, docName, chunkIndex));
          chunkIndex++;
          currentChunk = '';
        }
        const subChunks = this._splitLongParagraph(trimmed, docName, chunkIndex);
        chunks.push(...subChunks);
        chunkIndex += subChunks.length;
      } else {
        currentChunk = currentChunk.length > 0
          ? currentChunk + '\n\n' + trimmed
          : trimmed;
      }
    }

    // Flush remaining
    if (currentChunk.length > 0) {
      chunks.push(this._buildChunk(currentChunk, docName, chunkIndex));
    }

    return chunks;
  }

  /**
   * Split a long paragraph into ~500-char chunks at sentence boundaries
   * (.!? followed by space or end).
   */
  _splitLongParagraph(text, docName, startIndex) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let current = '';
    let idx = startIndex;

    for (const sentence of sentences) {
      if (current.length > 0 && current.length + sentence.length + 1 > 500) {
        chunks.push(this._buildChunk(current, docName, idx));
        idx++;
        current = '';
      }
      current = current.length > 0 ? current + ' ' + sentence : sentence;
    }

    if (current.length > 0) {
      chunks.push(this._buildChunk(current, docName, idx));
    }

    return chunks;
  }

  _buildChunk(text, docName, index) {
    const trimmed = text.trim();
    return {
      id: `${docName}#${index}`,
      docName: docName,
      index: index,
      text: trimmed,
      charCount: trimmed.length,
      wordCount: trimmed.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  // --- Status management ---

  _updateGlobalStatus(meta) {
    const docs = Object.values(meta.documents || {});
    if (docs.length === 0) {
      meta.globalStatus = 'idle';
    } else if (docs.every(d => d.status === 'indexed')) {
      meta.globalStatus = 'ready';
    } else if (docs.some(d => d.status === 'indexed')) {
      meta.globalStatus = 'ready'; // partially ready
    } else {
      meta.globalStatus = 'idle';
    }
    meta.lastIndexed = new Date().toISOString();
  }
}

module.exports = IndexingService;
