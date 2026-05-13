# Bootstrap Contract — Knowledge-Base

## Start Commands

**Prerequisite**: Node.js 24.x (`node --version` — must show v24.x).

```bash
# Linux / macOS
./init.sh

# Windows PowerShell
./init.ps1
```

Both scripts run: `npm install` → `npm test` → `npm run lint`.
They also export `GIT_CONFIG_GLOBAL` to work around a Windows git ownership issue.

Single-command baseline verification:
```bash
npm run verify     # Runs lint then test — use before starting any new work
```

Manual verification:
- Tests: `npm test` (143 assertions, zero dependencies beyond Node.js)
- Lint: `npm run lint` (ESLint on main.js, preload.js, renderer.js, test.js)

**Git note**: If git commands fail with "dubious ownership", the init scripts handle this automatically. For manual git use:
```bash
# Windows PowerShell
$env:GIT_CONFIG_GLOBAL = "./.gitconfig"
git -c safe.directory="$PWD" log --oneline -5

# Linux/macOS
export GIT_CONFIG_GLOBAL=./.gitconfig
git -c safe.directory="$PWD" log --oneline -5
```

## Current State

| Feature | Priority | Area | Status | Primary Files |
|---------|----------|------|--------|---------------|
| kb-001 | 1 | shell | passing | main.js, preload.js, index.html |
| kb-002 | 2 | documents | passing | main.js, renderer.js |
| kb-003 | 3 | qa | passing | renderer.js |
| kb-004 | 4 | documents | passing | main.js, preload.js, renderer.js |
| kb-005 | 5 | documents | passing | main.js, preload.js, renderer.js |
| kb-006 | 6 | indexing | passing | IndexingService.js, PersistenceService.js, main.js, preload.js, renderer.js |
| kb-007 | 7 | qa | not_started | QaService.js (create), main.js, preload.js, renderer.js, test.js |
| kb-008 | 8 | persistence | not_started | main.js, PersistenceService.js, renderer.js, index.html, test.js |

Baseline: 143 assertions pass, 0 ESLint errors/warnings. See `feature_list.json` for detailed evidence and `files` hints per feature.

`feature_list.json` is the canonical source of truth for feature status. `PROGRESS.md` is the narrative session log. When they disagree, `feature_list.json` wins.

## Project Structure

```
solution/
  AGENTS.md              # Entry: project overview, layer boundaries, verification
  BOOTSTRAP.md           # This file: start commands, current state, task breakdown
  feature_list.json      # Canonical feature status with evidence and file hints
  PROGRESS.md            # Narrative session log
  quality-document.md    # Quality grades per domain and layer
  README.md              # Human-facing description
  test.js                # Baseline verification suite (no framework)
  package.json           # Dependencies and scripts (incl. `npm run verify`)
  eslint.config.mjs      # ESLint configuration
  data/                  # Document storage (txt, md) + metadata
    documents-meta.json  # Per-document metadata
    chunks/              # Per-document chunk JSON (created by indexing)
    index/               # Index metadata (index-meta.json)
  src/
    main/main.js         # Electron main process + 11 IPC handlers
    preload/preload.js   # contextBridge API (11 methods)
    renderer/
      index.html         # App shell with status bar
      renderer.js        # UI logic (document list, Q&A, indexing, status bar)
      styles.css         # Full application styling
    services/
      IndexingService.js # Paragraph-aware chunking (~500 chars)
      PersistenceService.js # Chunk + index metadata atomic I/O
      README.md          # Implemented vs planned services
    shared/              # Reserved for IPC channel types (TypeScript target)
  docs/
    ARCHITECTURE.md      # Layer structure, data flow, import pipeline
    PRODUCT.md           # Feature requirements and UI layout
    recovery.md          # Baseline repair procedures
    session-checklist.md # End-of-session steps
    working-conventions.md # Commit format and working rules
```

## Task Breakdown

| Priority | Task | Acceptance | Primary Files |
|----------|------|------------|---------------|
| 7 | kb-007: Grounded Q&A with citations | Answers include chunk citations, confidence scores (0.85/0.30), Q&A history persists | `src/services/QaService.js` (create), `src/main/main.js`, `src/preload/preload.js`, `src/renderer/renderer.js`, `test.js` |
| 8 | kb-008: Cross-session persistence + status bar | Data survives restart, doc list auto-loads, status bar shows index state + doc count + last activity | `src/main/main.js`, `src/services/PersistenceService.js`, `src/renderer/renderer.js`, `test.js` |
| — | TypeScript migration | Convert JS to TS, strict mode, add React 18 + Vite for renderer | All `src/` files |
| — | Service layer completion | Extract DocumentService and QaService from main.js | `src/main/main.js`, `src/services/` |
