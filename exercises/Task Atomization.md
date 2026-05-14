# Exercise 5-1: Task Atomization

## Purpose
Pick a broad requirement (see ## Requirement) and break it into at least 5 atomic work units. For each unit, specify: (a) a single behavior description, (b) an executable verification command, (c) dependencies. Check whether the decomposition satisfies the WIP=1 constraint.

## Criteria for success
- Fully understand information from Links
- At least 5 atomic work units
- Specify each work unit
- Give WIP of each unit and check whether satisfies WIP=1
- refined doc

## Links
- Task Atomization, WIP: [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## Draw Clear Task Boundaries for Agents"

## Requirement

{
    "id":  "kb-007",
    "priority":  7,
    "area":  "qa",
    "title":  "Grounded Q&A with citations",
    "user_visible_behavior":  "User asks natural language questions. System retrieves relevant chunks and returns answers with citations pointing to specific document chunks. Confidence score shown (0.85 with citations, 0.30 without). Full Q&A history persists across sessions.",
    "status":  "not_started",
    "verification":  [
                        "Import and index at least two documents.",
                        "Ask a question -- verify answer includes citation to a document chunk.",
                        "Verify confidence score is displayed.",
                        "Close and reopen the app -- verify Q&A history is preserved.",
                        "Ask a question with no relevant documents -- verify low-confidence response."
                    ],
    "evidence":  [

                ],
    "notes":  "QaService with keyword-based retrieval + mock patterns. Q&A history stored in qa-history.json. No LLM integration in this version.",
    "files":  [
                "src/services/QaService.js (create)",
                "src/main/main.js (add IPC handlers)",
                "src/preload/preload.js (expose qa API)",
                "src/renderer/renderer.js (citation display, confidence score)",
                "src/renderer/styles.css (new Q&A styles)",
                "test.js (add Test 12)"
            ]
},

## Current State Analysis

Before decomposition, reviewed the existing codebase:

- **QaService**: Does not exist. `src/services/` contains only IndexingService and PersistenceService.
- **IPC**: No `qa:*` channels exist. 11 channels registered (data:*, indexing:*).
- **Preload**: No `qa` methods. 11 methods exposed under `window.kbAPI`.
- **Renderer**: `searchDocument()` does simple line-based keyword matching against the currently loaded document content. No chunk awareness, no citations, no confidence scores, no history persistence. Q&A thread accumulates user/response messages with basic formatting.
- **Data storage**: `data/qa-history.json` does not exist. Atomic I/O pattern available via PersistenceService.

The existing `searchDocument()` scans document text line-by-line for keyword overlap. kb-007 replaces this with chunk-aware retrieval across all indexed documents, adds structured citations, confidence scoring, and history persistence.

## Atomic Work Units (WIP=1 decomposition)

### Unit 1: QaService — chunk retrieval and answer generation

- (a) **Behavior**: Create `src/services/QaService.js`. Constructor accepts PersistenceService and IndexingService (dependency injection). `ask(question)` method: loads chunks for all indexed documents via IndexingService/ PersistenceService, matches question keywords against chunk text, ranks chunks by keyword match count, and returns a structured response: `{ answer: string, citations: [{ docName, chunkIndex, excerpt }], confidence: number }`. Confidence = 0.85 when citations found, 0.30 otherwise. Answer text generated from top-3 matching chunks with mock pattern: "Based on {docName}, ..." followed by excerpt concatenation. No LLM — pure keyword retrieval.

- (b) **Verification**: `node -e "const QaService = require('./src/services/QaService'); const ps = new (require('./src/services/PersistenceService'))('./data'); const is = new (require('./src/services/IndexingService'))(ps); is.indexDocument('test', 'The sky is blue.'); const qa = new QaService(ps, is); const r = qa.ask('sky'); console.assert(r.answer, 'answer'); console.assert(Array.isArray(r.citations), 'citations'); console.assert(r.confidence === 0.85, 'confidence high'); const r2 = qa.ask('zzzxyz'); console.assert(r2.confidence === 0.30, 'confidence low'); console.log('PASS');"`

- (c) **Dependencies**: PersistenceService (`src/services/PersistenceService.js` — exists), IndexingService (`src/services/IndexingService.js` — exists). No IPC, no renderer, no preload.

- **WIP**: Creates one new file (`QaService.js`). No other file touched. WIP=1 satisfied.

### Unit 2: QaService — history persistence

- (a) **Behavior**: Extend QaService to persist Q&A history. Constructor loads existing history from `data/qa-history.json` (atomic read via fs, JSON parse with fallback to empty array). `ask()` appends a history entry `{ id, question, answer, citations, confidence, timestamp }` to in-memory array and writes to file (atomic write: temp file + rename). `getHistory()` returns the full array. History survives service reconstruction.

- (b) **Verification**: `node -e "const QaService = require('./src/services/QaService'); const ps = new (require('./src/services/PersistenceService'))('./data'); const is = new (require('./src/services/IndexingService'))(ps); const qa = new QaService(ps, is); console.assert(qa.getHistory().length === 0, 'empty start'); qa.ask('test?'); console.assert(qa.getHistory().length === 1, 'one entry'); const e = qa.getHistory()[0]; console.assert(e.question === 'test?', 'question'); console.assert(typeof e.timestamp === 'string', 'timestamp'); console.assert(e.confidence !== undefined, 'confidence'); // Reconstruct and verify persistence const qa2 = new QaService(ps, is); console.assert(qa2.getHistory().length === 1, 'persisted'); console.log('PASS');"`

- (c) **Dependencies**: Unit 1 (QaService base exists). PersistenceService (exists).

- **WIP**: Modifies one file (`QaService.js`), creates `data/qa-history.json` on first write. WIP=1 satisfied.

### Unit 3: IPC handlers for Q&A

- (a) **Behavior**: Add two IPC handlers to `src/main/main.js`: `qa:ask` — receives `(question)`, calls `qaService.ask(question)`, returns structured response. `qa:get-history` — receives no args, calls `qaService.getHistory()`, returns history array. Instantiate QaService in main.js with existing `persistence` and `indexingService` dependencies. Update the IPC channel contract comment block in main.js to include the two new channels.

- (b) **Verification**: Add assertions to `test.js` (or standalone script): verify main.js `require`s QaService, registers `qa:ask` handler, registers `qa:get-history` handler. Pattern matches existing Tests 7/10/11 handler registration checks.

- (c) **Dependencies**: Unit 2 (QaService complete with history). PersistenceService and IndexingService already instantiated in main.js.

- **WIP**: Modifies one file (`main.js`). WIP=1 satisfied.

### Unit 4: Preload API for Q&A

- (a) **Behavior**: Extend `src/preload/preload.js` to expose two new methods on `window.kbAPI`: `ask(question)` — invokes `ipcRenderer.invoke('qa:ask', question)`. `getHistory()` — invokes `ipcRenderer.invoke('qa:get-history')`. Update the API surface comment block in preload.js to document the two new methods.

- (b) **Verification**: Add assertions to `test.js`: verify preload exposes `ask` method, exposes `getHistory` method, and each invokes the correct IPC channel (`qa:ask`, `qa:get-history`). Pattern matches existing Test 6 preload API surface checks.

- (c) **Dependencies**: Unit 3 (IPC handlers `qa:ask` and `qa:get-history` registered).

- **WIP**: Modifies one file (`preload.js`). WIP=1 satisfied.

### Unit 5: Renderer — citation display, confidence score, and IPC-based Q&A

- (a) **Behavior**: Update `src/renderer/renderer.js` Q&A submit handler: replace `searchDocument(question, content)` with `window.kbAPI.ask(question)`. Parse structured response: display answer text, render citations as a list below the answer (each citation shows document name, chunk index, and excerpt), render confidence score as a badge (e.g. "Confidence: 85%" or "Low confidence"). Update `src/renderer/styles.css` with styles for `.qa-citation`, `.qa-citation-doc`, `.qa-citation-excerpt`, `.qa-confidence`, `.qa-confidence-high`, `.qa-confidence-low`. Q&A thread still accumulates messages; placeholder removal unchanged. The `searchDocument()` function can be removed or kept as fallback.

- (b) **Verification**: Add assertions to `test.js`: verify renderer.js defines a function that calls `kbAPI.ask`, creates citation DOM elements (e.g. `.qa-citation` class), and creates confidence score element (e.g. `.qa-confidence` class). Pattern matches existing Test 5/5b renderer function checks.

- (c) **Dependencies**: Unit 4 (preload `ask()` and `getHistory()` available). Unit 2 (QaService returns structured response).

- **WIP**: Modifies two files (`renderer.js`, `styles.css`). Both are renderer-layer only. WIP=1 satisfied.

### Unit 6: Tests — Test 12 for kb-007

- (a) **Behavior**: Add Test 12 to `test.js` with ~15-20 assertions covering kb-007 end-to-end:
  - QaService instantiation and `ask()` returns `{ answer, citations, confidence }` shape.
  - QaService citation includes `docName`, `chunkIndex`, and `excerpt` fields.
  - QaService confidence is 0.85 when citations found, 0.30 when none.
  - QaService `getHistory()` returns entries with `question`, `answer`, `citations`, `confidence`, `timestamp`.
  - QaService history persists across reconstruction (write, re-read).
  - main.js registers `qa:ask` and `qa:get-history` IPC handlers.
  - main.js requires QaService.
  - preload exposes `ask` and `getHistory` methods invoking correct IPC channels.
  - renderer defines function that calls `kbAPI.ask`.
  - renderer creates citation DOM elements.
  - renderer creates confidence score DOM element.

- (b) **Verification**: `npm test` — Test 12 passes alongside all existing tests. Expected total: ~160-165 assertions.

- (c) **Dependencies**: Units 1-5 (all code in place).

- **WIP**: Modifies one file (`test.js`). WIP=1 satisfied.

## WIP=1 Constraint Check

| Unit | Files Modified | Depends On | WIP=1? |
|------|---------------|------------|--------|
| 1 | QaService.js (create) | — | Yes |
| 2 | QaService.js | Unit 1 | Yes |
| 3 | main.js | Unit 2 | Yes |
| 4 | preload.js | Unit 3 | Yes |
| 5 | renderer.js, styles.css | Unit 4 | Yes |
| 6 | test.js | Units 1–5 | Yes |

Each unit touches a distinct write set. Units 1 and 2 both touch QaService.js, but they are
strictly sequential (Unit 2 cannot start before Unit 1 completes). No two units are active
simultaneously on the same file. WIP=1 is satisfied across the entire decomposition.

## Dependency Graph (DAG)

```
[Unit 1: QaService core]
       |
       v
[Unit 2: QaService history]
       |
       v
[Unit 3: IPC handlers]
       |
       v
[Unit 4: Preload API]
       |
       v
[Unit 5: Renderer]
       |
       v
[Unit 6: Tests]
```

Linear dependency chain — no parallelism possible at this stage because each layer builds on
the previous. This is characteristic of a new feature crossing all Electron layers (service →
IPC → preload → renderer).

## Completion Evidence per Unit

Each unit has an executable verification command. The tests added in Unit 6 will also
retroactively validate Units 1–5, providing a second layer of verification. The pattern: unit
verification proves the unit works in isolation; Test 12 proves the whole chain works
end-to-end.

## Refinements Applied

- Original file had placeholder structure with empty bullets. Filled with 6 concrete units.
- Added Current State Analysis to ground the decomposition in actual codebase facts.
- Included WIP=1 constraint check table showing each unit's write set and dependencies.
- Added DAG visualization to make the linear dependency chain explicit.
- Added Completion Evidence section linking per-unit verification to end-to-end tests.
- Unit boundaries follow Electron layer boundaries (service → main → preload → renderer),
  which is the natural seam for this architecture.
