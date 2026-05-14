/*
 * QaService.js -- Grounded Q&A with chunk retrieval and citations
 *
 * Retrieves relevant chunks across all indexed documents, matches
 * question keywords, ranks by relevance, and returns structured
 * responses with citations and confidence scores.
 * Persists full Q&A history to qa-history.json with atomic writes.
 * No LLM -- pure keyword-based retrieval.
 */

const fs = require("fs");
const path = require("path");

class QaService {
  constructor(persistenceService, indexingService) {
    this.persistence = persistenceService;
    this.indexing = indexingService;
    this.history = this._loadHistory();
  }

  /**
   * Ask a natural language question. Returns a structured response
   * with answer text, citations, and a confidence score.
   * Appends the Q&A pair to persistent history.
   * @param {string} question
   * @returns {{ answer: string, citations: Array, confidence: number }}
   */
  ask(question) {
    const allChunks = this._loadAllChunks();

    if (allChunks.length === 0) {
      const result = {
        answer: "No documents have been indexed. Please import and index documents first.",
        citations: [],
        confidence: 0.30
      };
      this._appendHistory(question, result);
      return result;
    }

    const keywords = this._extractKeywords(question);

    if (keywords.length === 0) {
      const result = {
        answer: "No relevant information found in the knowledge base. Try rephrasing your question.",
        citations: [],
        confidence: 0.30
      };
      this._appendHistory(question, result);
      return result;
    }

    // Score each chunk by keyword match count
    const scored = allChunks.map(chunk => {
      const lowerText = chunk.text.toLowerCase();
      let matchCount = 0;
      for (const word of keywords) {
        if (lowerText.includes(word)) {
          matchCount++;
        }
      }
      return { chunk, matchCount };
    });

    // Filter to chunks with at least one match, sort by match count descending
    const matched = scored
      .filter(s => s.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);

    if (matched.length === 0) {
      const result = {
        answer: "No relevant information found in the knowledge base. Try rephrasing your question.",
        citations: [],
        confidence: 0.30
      };
      this._appendHistory(question, result);
      return result;
    }

    // Take top 3 chunks
    const topMatches = matched.slice(0, 3);

    // Build answer text from top matches
    const answerParts = topMatches.map(m =>
      "Based on \"" + m.chunk.docName + "\", chunk " + m.chunk.index + ":\n" + m.chunk.text
    );
    const answer = answerParts.join("\n\n");

    // Build citations
    const citations = topMatches.map(m => ({
      docName: m.chunk.docName,
      chunkIndex: m.chunk.index,
      excerpt: m.chunk.text.length > 200
        ? m.chunk.text.substring(0, 200) + "..."
        : m.chunk.text
    }));

    const result = {
      answer,
      citations,
      confidence: 0.85
    };
    this._appendHistory(question, result);
    return result;
  }

  /**
   * Return the full Q&A history array.
   */
  getHistory() {
    return this.history;
  }

  // --- Private helpers ---

  /**
   * Append a Q&A pair to in-memory history and persist to disk.
   */
  _appendHistory(question, result) {
    const entry = {
      id: this.history.length + 1,
      question,
      answer: result.answer,
      citations: result.citations,
      confidence: result.confidence,
      timestamp: new Date().toISOString()
    };
    this.history.push(entry);
    this._saveHistory();
  }

  /**
   * Load existing Q&A history from qa-history.json.
   * Returns empty array if file does not exist or is corrupt.
   */
  _loadHistory() {
    const historyPath = path.join(this.persistence.dataDir, "qa-history.json");
    try {
      if (fs.existsSync(historyPath)) {
        const data = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch { /* corrupt or empty */ }
    return [];
  }

  /**
   * Atomic write of in-memory history to qa-history.json.
   */
  _saveHistory() {
    const historyPath = path.join(this.persistence.dataDir, "qa-history.json");
    const tmpPath = historyPath + ".tmp";
    fs.writeFileSync(tmpPath, JSON.stringify(this.history, null, 2), "utf-8");
    fs.renameSync(tmpPath, historyPath);
  }

  /**
   * Load all chunks from all indexed documents.
   */
  _loadAllChunks() {
    const status = this.indexing.getStatus();
    const docs = status.documents || {};
    const allChunks = [];

    for (const docName of Object.keys(docs)) {
      if (docs[docName].status === "indexed") {
        const chunks = this.indexing.getChunks(docName);
        if (chunks && chunks.length > 0) {
          allChunks.push(...chunks);
        }
      }
    }

    return allChunks;
  }

  /**
   * Extract meaningful keywords from a question string.
   * Filters out words 2 characters or shorter (stopwords heuristic).
   */
  _extractKeywords(question) {
    const words = question.toLowerCase().match(/\b\w+\b/g) || [];
    return words.filter(w => w.length > 2);
  }
}

module.exports = QaService;
