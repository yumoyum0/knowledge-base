# AGENTS.md

## Project

**Knowledge-Base**: a minimal Electron desktop app for managing local markdown/text documents with Q&A search.

**Tech stack**: Node.js 24, Electron 33, vanilla HTML/CSS/JS (no framework).

## Startup Workflow

Before writing code:

1. Confirm the working directory with `pwd`.
2. Read `claude-progress.md` for the latest verified state and next step.
3. Read `feature_list.json` and choose the highest-priority unfinished feature.
4. Review recent commits with `git log --oneline -5`.
5. Run `./init.sh` (or `npm install && npm test` on Windows).
6. Confirm baseline verification passes before starting new work.

If baseline verification is already failing, fix that first. Do not stack new
feature work on top of a broken starting state.

## Verification Commands

| Command | What it checks |
|---------|---------------|
| `npm test` | 75 assertions across data/, file listing, HTML structure, renderer functions, Q&A, CRUD, preload API, main.js IPC |
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

## Required Artifacts

- `feature_list.json`: source of truth for feature state
- `claude-progress.md`: session log and current verified status
- `init.sh`: standard startup and verification path
- `quality-document.md`: quality grades per domain and layer
- `session-handoff.md`: optional compact handoff for larger sessions

## Definition Of Done

A feature is done only when all of the following are true:

- the target behavior is implemented
- the required verification actually ran (npm test passes)
- evidence is recorded in `feature_list.json` or `claude-progress.md`
- the repository remains restartable from the standard startup path

## End Of Session

Before ending a session:

1. Update `claude-progress.md`.
2. Update `feature_list.json`.
3. Update `quality-document.md`.
4. Record any unresolved risk or blocker.
5. Commit with a descriptive message once the work is in a safe state.
6. Leave the repo clean enough for the next session to run `./init.sh` immediately.

## Further Reading

- `data/Harness Engineering.md` — the five-subsystem harness model this repo follows
- `exercises/` — harness engineering exercises
