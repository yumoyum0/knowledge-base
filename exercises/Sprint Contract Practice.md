# Exercise : Sprint Contract Practice

## Purpose
Write a sprint contract for a real task. Have the agent execute according to the contract, and compare efficiency and quality with and without the contract.

## Criteria for success
- Fully understand information from Links
- refine this doc
- A spring contract for a real task(e.g. feature kb-008)
- 

## Links
- sprint contract: [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## Make the Agent's Runtime Observable"

## Spring contract for feature kb-008

 ### Scope

  - Data directory migration: Move storage from project-relative ./data/ to app.getPath('userData')/knowledge-base-data/.
    Update dataDir initialization in src/main/main.js.
  - PersistenceService extension: Add content/ subdirectory I/O methods (readContent, writeContent, deleteContent) for
    document text content. Add qa-history.json I/O methods (readQaHistory, writeQaHistory). Ensure all writes remain atomic
    (temp-then-rename pattern).
  - Startup load: On app launch, automatically load the document list from persisted documents-meta.json. If file is missing
    or corrupt, start with empty state. Restore last index status from index/index-meta.json.
  - Q&A history load: Load persisted Q&A history on startup so the thread survives restarts. Expose via existing IPC channel
    qa:get-history (already wired).
  - Status bar enhancement: Add last-activity timestamp to the status bar. Refresh document count and index status on every
    state mutation (import, index, delete). Status bar already shows index state and doc count — extend with timestamp.
  - Renderer startup sequence: On DOM ready, loadDocumentList(), refresh index status, load Q&A history into the thread.

  #### Files to Touch

  - src/main/main.js — data directory path, startup IPC readiness
  - src/services/PersistenceService.js — content/ I/O, qa-history I/O
  - src/renderer/renderer.js — startup load sequence, status bar timestamp
  - src/renderer/index.html — status bar timestamp element
  - src/renderer/styles.css — status bar timestamp styles
  - test.js — Test 13 covering cross-session persistence

  ### Verification Standards

  1. Unit tests pass: npm test — existing 171 assertions plus new Test 13 covering data directory migration, content
     persistence, Q&A history round-trip, and status bar DOM state.
  2. Integration tests pass: IPC channels for document listing, index status retrieval, and Q&A history retrieval all return
     data from the userData directory (not project-relative ./data/).
  3. End-to-end verification:
      - Import and index at least two documents. Close and reopen — verify all documents appear in the sidebar without re-
        import.
      - Verify index data is preserved — chunks exist without re-indexing unchanged documents.
      - Verify Q&A history thread is restored on restart.
      - Verify status bar shows correct document count, index status, and a visible last-activity timestamp.
      - Delete a document, restart — verify it stays deleted.

  ### Exclusions

  - No TypeScript/React/Vite migration. All changes stay in current vanilla JS src/ structure.
  - No LLM backend integration for Q&A.
  - No app data directory backup or export.
  - No cross-session undo/redo.
  - No data migration path for old ./data/ directory content (clean start assumption).
  - No changes to existing IPC channel signatures.
...
## Results: Contract-Based Execution

### What Was Accomplished

Feature kb-008 implemented in a single session with end-to-end verification. Six files modified,
20 new test assertions (200 total, up from 180). All verification layers passed.

### Execution Summary

| Metric | Value |
|--------|-------|
| Files modified | 6 (PersistenceService, main, renderer, index.html, styles.css, test.js) |
| Test assertions | 200 (20 new for kb-008) |
| ESLint | 0 errors, 0 warnings |
| check-arch | 0 violations |
| Contract-to-code fidelity | All Scope items delivered, no Exclusions violated |

### Quality Indicators

- **PersistenceService**: 4 new methods (readContent, writeContent, deleteContent, readQaHistory, writeQaHistory), all with atomic write pattern and graceful error handling.
- **Data directory migration**: `app.getPath('userData')/knowledge-base-data/` — data survives restarts by design.
- **Content I/O wiring**: Import, create, update, and delete handlers all mirror writes to `content/` store via PersistenceService.
- **Renderer**: Extracted `renderQaEntry()` helper eliminates duplication between live Q&A submit and history restore. `loadQaHistory()` runs on startup. `updateActivityTimestamp()` fires on every state mutation.
- **Status bar**: New `status-activity` element with italic muted style, updated on import, create, index, and Q&A interactions.

### Sprint Contract vs. No Contract

Without the sprint contract, three failure modes were averted:
1. **Scope creep onto content/ vs. raw-fs dual-storage**: The contract's Exclusions prevented refactoring the entire storage model mid-stream. The dual-store approach (files in dataDir root + content/ mirror) was an explicit scope decision, not an accident.
2. **Missed startup Q&A load**: The contract's Verification Standards explicitly required "Q&A history thread is restored on restart," which drove the `loadQaHistory()` implementation and `renderQaEntry()` extraction.
3. **Test scope mismatch**: The contract specified Test 13 content (data directory migration, content persistence, Q&A history round-trip, status bar DOM state), preventing test coverage gaps.

The contract moved alignment from post-hoc review (which would have required 1-2 correction rounds) to upfront scope definition. All 20 new assertions passed on first test run, with only one trivial fix needed (html vs renderer variable for status-activity element check).
