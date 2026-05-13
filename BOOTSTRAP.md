# Bootstrap Contract — Knowledge-Base

## Start Commands

```bash
# Linux / macOS
./init.sh

# Windows PowerShell
./init.ps1
```

Both scripts run: `npm install` → `npm test` → `npm run lint`

Manual verification:
- Tests: `npm test` (143 assertions, zero dependencies beyond Node.js)
- Lint: `npm run lint` (ESLint on main.js, preload.js, renderer.js, test.js)

**Prerequisites**: Node.js 24.x (pinned in `.node-version`, `.nvmrc`, `package.json` engines field). Electron 33.x (devDependency, installed via npm).

## Current State

| Feature | Status | Area |
|---------|--------|------|
| kb-001 | passing | App window with sidebar + Q&A panel |
| kb-002 | passing | Load and display documents from data/ |
| kb-003 | passing | Q&A submission and response display |
| kb-004 | passing | Document CRUD (create, edit, delete) |
| kb-005 | passing | Document import via file picker |
| kb-006 | passing | Text indexing with paragraph-aware chunking |
| kb-007 | not_started | Grounded Q&A with citations |
| kb-008 | not_started | Cross-session persistence + status bar |

Baseline: 143 assertions pass, 0 ESLint errors/warnings.

## Project Structure

```
solution/
  AGENTS.md              # Entry: project overview, layer boundaries, verification
  feature_list.json      # Feature status (single source of truth for progress)
  PROGRESS.md            # Session log and verified status
  quality-document.md    # Quality grades per domain and layer
  README.md              # Human-facing project description
  test.js                # Baseline verification suite (no framework)
  package.json           # Dependencies and scripts
  eslint.config.mjs      # ESLint configuration
  data/                  # Document storage (txt, md) + metadata
    documents-meta.json  # Per-document metadata
    chunks/              # Per-document chunk JSON (created by indexing)
    index/               # Index metadata (index-meta.json)
  src/
    main/main.js         # Electron main process + IPC handlers (11 channels)
    preload/preload.js   # contextBridge API (11 methods)
    renderer/
      index.html         # App shell
      renderer.js        # UI logic
      styles.css         # Styling
    services/
      IndexingService.js # Paragraph-aware chunking (~500 chars)
      PersistenceService.js # Chunk + index metadata I/O
    shared/              # Reserved for IPC channel types (TypeScript target)
  docs/
    ARCHITECTURE.md      # Layer structure, data flow, import pipeline
    PRODUCT.md           # Feature requirements and UI layout
    recovery.md          # Baseline repair procedures
    session-checklist.md # End-of-session steps
    working-conventions.md # Commit format and working rules
```

## Task Breakdown

| Priority | Task | Acceptance |
|----------|------|------------|
| 7 | kb-007: Grounded Q&A with citations | Q&A returns chunks with citations, confidence scores shown, history persisted |
| 8 | kb-008: Cross-session persistence + status bar | Data survives restart, status bar shows index state and doc count |
| — | TypeScript migration | Convert JS to TS, add React 18 + Vite for renderer |
| — | Service layer completion | Extract remaining business logic from main.js into services |

## Known Gotchas

1. **git ownership**: Windows sandbox may produce "dubious ownership" errors. Use `git -c safe.directory="$PWD"` or source `init.ps1`/`init.sh` which set `GIT_CONFIG_GLOBAL`.
2. **Headless Electron**: `npm start` won't render a window in headless environments. Tests exercise all logic programmatically.
3. **Path separator**: `init.ps1` uses `.\` (Windows) — `init.sh` uses `./` (Unix). Both exist.
