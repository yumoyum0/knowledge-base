# AGENTS.md

## Project

**Knowledge-Base**: an Electron desktop app for managing a personal knowledge base. Import text/Markdown documents, index them into searchable chunks, and ask grounded Q&A with citations.

**Tech stack**: Node.js 24.15+, Electron 33.x. Current: vanilla JS in src/. Target: TypeScript + React 18 + Vite.

## Docs Hierarchy

Read these before writing any code:

| Order | Document | Purpose |
|-------|----------|---------|
| 1 | `docs/ARCHITECTURE.md` | Electron layer structure, data flow, import pipeline |
| 2 | `docs/PRODUCT.md` | Feature requirements and user-facing behavior |
| 3 | `feature_list.json` | **Canonical** feature status (authoritative over PROGRESS.md). Also read before starting new work. |
| 4 | `PROGRESS.md` | Session log and verified status |

`feature_list.json` is the canonical source of truth for feature status. `PROGRESS.md` is the narrative session log. When they disagree, `feature_list.json` wins.

When adding features, update the relevant doc before writing code.

## Feature List Rules
- Feature list file: feature_list.json
- Only one feature active at a time
- Verification command must pass before marking as passing
- Don't modify feature list states yourself 鈥?the verification script updates them automatically

## Quick Start

**Prerequisite**: Node.js 24.x (`node --version`).

```bash
# Linux/macOS
./init.sh

# Windows PowerShell
./init.ps1
```

Both scripts run `npm install`, `npm test`, and `npm run lint`. They also set up
`GIT_CONFIG_GLOBAL` to work around a git ownership issue.

## Layer Boundaries

```
src/renderer/  鈫愨啋  src/preload/  鈫愨啋  src/main/  鈫愨啋  src/services/
(React UI)          (contextBridge)    (ipcMain)      (business logic)
```

- **Renderer** (`src/renderer/`, currently `renderer.js` at root): React + TypeScript UI. Communicates exclusively through `window.knowledgeBase` API. Never imports Node.js modules.
- **Preload** (`src/preload/`, currently `preload.js` at root): The ONLY bridge. Uses `contextBridge.exposeInMainWorld`. API surface: `kbAPI.*` (current JS) 鈫?`window.knowledgeBase.*` (target TS).
- **Main** (`src/main/`, currently `main.js` at root): Owns BrowserWindow lifecycle, IPC registration, and all filesystem access via services.
- **Services** (`src/services/`): Pure business logic. DocumentService, IndexingService, QaService, PersistenceService.
- **Shared** (`src/shared/`): IPC channel constants and type definitions. Channels defined once, imported by both main and preload.

**Current 鈫?Target migration**: Root-level JS files will migrate into `src/` as TypeScript conversion proceeds.

## Startup Workflow

Before writing code:

1. Read this file completely.
2. Read `docs/ARCHITECTURE.md` to understand the layer structure.
3. Read `docs/PRODUCT.md` to understand feature requirements.
4. Read `feature_list.json` and choose the highest-priority unfinished feature.
   If all features are passing, consult `quality-document.md` for unimplemented
   domains, then add a new feature entry to `feature_list.json` before starting.
5. Review recent commits with `git log --oneline -5`.
6. Run `./init.sh` or `./init.ps1`.
7. Confirm baseline verification passes (`npm run verify`) before starting new work.
| `npm run check-arch` | Scans renderer for forbidden Node.js imports (architectural constraint). 0 violations = clean. |

If baseline verification is already failing, fix that first. See
[docs/recovery.md](docs/recovery.md).

### Git Note

If `git log` fails with "dubious ownership", use:
```
git -c safe.directory="$PWD" log --oneline -5
```
Both init scripts export `GIT_CONFIG_GLOBAL` pointing to the project-local
`.gitconfig` to work around this permanently.

## Verification Commands

| Command | What it checks |
|---------|---------------|
| `npm run verify` | Single-command baseline: lint, check-arch, then test. Use before starting new work. |
| `npm run check-arch` | Scans renderer for forbidden Node.js imports (architectural constraint). 0 violations = clean. |
| `npm test` | 200 assertions across data/, file listing, HTML structure, renderer functions, Q&A, CRUD, preload API, main.js IPC, indexing, persistence |
| `npm run lint` | ESLint on main.js, preload.js, renderer.js, test.js 鈥?0 errors, 0 warnings |
| `node --version` | Must be Node 24.x |
| `npm install` | Dependencies up to date |

## Conventions

- **Electron security**: `contextIsolation: true`, `nodeIntegration: false` 鈥?never relax.
- **IPC channels**: Follow pattern `namespace:action` (e.g., `documents:import`, `documents:get-content`). Defined in `src/shared/types.ts` (target).
- **Path safety**: All renderer-provided paths validated against `dataDir`. New filenames go through `path.basename()`.
- **TypeScript** (target): Strict mode. No `any` without a comment. Named exports only.
- **Preload surface**: Minimal. Add new IPC channels only when necessary.

## Working Rules

- Work on one feature at a time
- Only start the next feature after the current one passes end-to-end verification
- Don't "also refactor" feature B while implementing feature A
- Do not mark a feature complete just because code was added.
- Keep changes within the selected feature scope.
- Do not silently change verification rules during implementation.
- Prefer durable repo artifacts over chat summaries.
- Update README.md before commit.
- See [docs/working-conventions.md](docs/working-conventions.md) for commit format and full rules.

## Definition of Done
- Feature complete = end-to-end verification passed, not "code is written"
- Required verification levels:
  1. Unit tests pass
  2. Integration tests pass
  3. End-to-end flow verification passes
- Do not proceed to level 2 if level 1 fails
- Do not proceed to level 3 if level 2 fails

## Clean State Checklist

Run at the end of every session. All five dimensions must pass before the
session is considered complete. See [clean-state-checklist.md](clean-state-checklist.md)
for the full template and violation log.

### 1. Build
- `node --version` is 24.x, `npm install` clean

### 2. Test
- `npm test` passes (200 assertions), `npm run lint` clean, `npm run check-arch` clean

### 3. Progress
- `feature_list.json`, `PROGRESS.md`, `session-handoff.md`, and `quality-document.md` all current

### 4. Artifact
- No debug code, stale files, or contradictory documentation. `git status` clean.

### 5. Startup
- `./init.ps1` / `./init.sh` succeeds. Next session can start without manual repair.

## Session Handoff

When resuming work, read [session-handoff.md](session-handoff.md) for context from the previous session. When finishing a session, update it with:

- What was accomplished
- What remains
- Any blockers or decisions made
- Files that were modified

## Topic Docs

| When | Read |
|------|------|
| Writing code or committing | [docs/working-conventions.md](docs/working-conventions.md) |
| Something breaks | [docs/recovery.md](docs/recovery.md) |
| Closing a session | [docs/session-checklist.md](docs/session-checklist.md) |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm test` fails | Check `node --version` (needs 24.x). Delete `node_modules/` and rerun `npm install`. |
| `git log` fails with dubious ownership | Run `git -c safe.directory="$PWD" log --oneline -5` or source `init.sh` / `init.ps1`. |
| ESLint errors after code changes | Run `npm run lint` locally. Check `eslint.config.mjs` for missing globals. |
| Electron won't launch | Visual verification requires a desktop. This sandbox is headless. |

## Further Reading

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 鈥?Electron layers, data flow, import pipeline
- [docs/PRODUCT.md](docs/PRODUCT.md) 鈥?Feature requirements and UI layout
- [quality-document.md](quality-document.md) 鈥?Quality grades per domain and layer
- [data/Harness Engineering.md](data/Harness%20Engineering.md) 鈥?Five-subsystem harness model
- [BOOTSTRAP.md](BOOTSTRAP.md) 鈥?Bootstrap contract: start commands, current state, task breakdown
