# AGENTS.md

## Project

**Knowledge-Base**: a minimal Electron desktop app for managing local markdown/text documents with Q&A search.

**Tech stack**: Node.js 24.15+, Electron 33.x, vanilla HTML/CSS/JS (no framework).

## Quick Start

```bash
# Linux/macOS
./init.sh

# Windows PowerShell
./init.ps1
```

Both scripts run `npm install`, `npm test`, and `npm run lint`. They also set up
`GIT_CONFIG_GLOBAL` to work around a git ownership issue (see Git Note below).

## Project Structure

| File | Role |
|------|------|
| `main.js` | Electron main process — window creation, IPC handlers, file system ops |
| `preload.js` | Context bridge — exposes `kbAPI` to renderer via `contextBridge` |
| `renderer.js` | Browser-side UI — document list, Q&A, edit mode, CRUD wiring |
| `index.html` | App shell — sidebar + main panel layout |
| `styles.css` | All visual styling |
| `test.js` | Baseline verification — 75 assertions, no framework |
| `package.json` | Dependencies (Electron 33), scripts, engines |
| `data/` | User document storage (.txt, .md); created on first launch |

## Architecture

```
main.js  ←→  preload.js  ←→  renderer.js
(ipcMain)     (contextBridge)   (kbAPI.*)

main.js owns the filesystem. renderer.js owns the DOM.
preload.js is a narrow, auditable bridge between them.
```

- **contextIsolation: true** — renderer cannot access Node.js directly
- **nodeIntegration: false** — no `require()` in the browser context
- All data flows through named IPC channels (`data:list-files`, `data:read-file`, etc.)

## Startup Workflow

Before writing code:

1. Confirm the working directory with `pwd`.
2. Read `PROGRESS.md` for the latest verified state and next step.
3. Read `feature_list.json` and choose the highest-priority unfinished feature.
   If all features are passing, consult `quality-document.md` for unimplemented
   domains, then add a new feature entry to `feature_list.json` before starting.
4. Review recent commits with `git log --oneline -5`.
5. Run `./init.sh` or `./init.ps1`.
6. Confirm baseline verification passes before starting new work.

If baseline verification is already failing, fix that first. Do not stack new
feature work on top of a broken starting state.

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
| `npm test` | 75 assertions across data/, file listing, HTML structure, renderer functions, Q&A, CRUD, preload API, main.js IPC |
| `npm run lint` | ESLint on main.js, preload.js, renderer.js, test.js — 0 errors, 0 warnings |
| `node --version` | Must be Node 24.x |
| `npm install` | Dependencies up to date |

## Hard Constraints

- `contextIsolation: true`, `nodeIntegration: false` — never relax these.
- All file paths from renderer must be validated against `dataDir` in main process.
- New filenames must go through `path.basename()` before touching disk.
- Keep the preload API surface minimal — add new IPC channels only when necessary.

## Working Rules

- Work on one feature at a time.
- Do not mark a feature complete just because code was added.
- Keep changes within the selected feature scope unless a blocker forces a
  narrow supporting fix.
- Do not silently change verification rules during implementation.
- Prefer durable repo artifacts over chat summaries.

## Commit Conventions

```
kb-XXX: short description — status
```

Examples:
- `kb-004: document management — create, edit, delete with path safety — passing`
- `harness: add ESLint; fix lint issues in main.js — feedback 3->4`

## Session Lifecycle

- **Before closing a session**: Follow the checklist in [docs/session-checklist.md](docs/session-checklist.md).
  Covers required artifacts, definition of done, end-of-session steps, and pre-commit verification.

## Recovery

If baseline verification fails when you first run init:

1. Check what changed: `git status`
2. Revert unintended changes: `git checkout -- .`
3. Re-run init: `./init.sh` or `./init.ps1`

If tests fail after your own changes:
- Check for stale test artifacts: `rm data/__test_kb004.md` (test.js Test 9 leaves this if it crashed)
- Re-run: `npm test`

If dependencies are corrupted:
- Delete and reinstall: `rm -rf node_modules && npm install`

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm test` fails | Check `node --version` (needs 24.x). Delete `node_modules/` and rerun `npm install`. |
| `git log` fails with dubious ownership | Run `git -c safe.directory="$PWD" log --oneline -5` or source `init.sh` / `init.ps1`. |
| ESLint errors after code changes | Run `npm run lint` locally before committing. Check `eslint.config.mjs` for missing globals. |
| Electron won't launch | Visual verification requires a desktop environment. This sandbox is headless. |

## Further Reading

Read when orienting or investigating:
- [Harness Engineering](data/Harness%20Engineering.md) — the five-subsystem harness model this repo follows
- [Five-Tuple Audit](exercises/five-tuple%20harness%20audit.md) — completed harness audit with scores

Read when adding tests or diagnosing failures:
- [Session Checklist](docs/session-checklist.md) — required artifacts, definition of done, end-of-session steps

Read when starting a new session:
- [quality-document.md](quality-document.md) — quality grades per domain and architectural layer
