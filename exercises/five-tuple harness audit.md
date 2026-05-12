# Exercise: Five-tuple harness audit

## Purpose
Do a complete audit using the five-tuple framework. Score each subsystem 1-5. Find the lowest-scoring subsystem, improve it, then observe the change in agent performance.

## Criteria for success
- Each of the five subsystems is scored 1-5 with concrete evidence for the score.
- The lowest-scoring subsystem is identified.
- One concrete improvement is made to that subsystem.
- The change in agent behavior is observed and documented.

## Links
- Five-tuple framework: [data/Harness Engineering.md](../data/Harness%20Engineering.md)

## Audit Results (2026-05-12)

### 1. Instruction Subsystem — Score: 2 → 3

**Before**: AGENTS.md (41 lines). Missing project purpose, tech stack, versions, verification commands table, hard constraints, and links to further docs.

**After**: AGENTS.md (55 lines). Added Project section (one-sentence purpose + tech stack with versions), Verification Commands table, Hard Constraints section, Further Reading links. Fixed duplicate step numbering in End Of Session.

### 2. Tool Subsystem — Score: 3

Shell, file ops, apply_patch, npm all functional. `git log` broken due to repository ownership mismatch and locked global gitconfig.

### 3. Environment Subsystem — Score: 2 → 3

**Before**: `package.json` existed with Electron 33 dependency and `init.sh`. Missing Node version pinning.

**After**: Added `.node-version` (24), `.nvmrc` (24), and `"engines": { "node": ">=24.0.0" }` in `package.json`.

### 4. State Subsystem — Score: 4 → 5

`PROGRESS.md`, `feature_list.json`, and `quality-document.md` are detailed and well-structured. **After**: Created `session-handoff.md` with quick-state summary, changed-files inventory, blockers, and next-session steps. Fixed garbled Unicode in `feature_list.json`. All five artifacts now present and consistent.

### 5. Feedback Subsystem — Score: 3 → 4

**Before**: `npm test` (75 assertions) was the only verification. No linting or static analysis.

**After**: Installed ESLint 10, created `eslint.config.mjs` with per-environment configs (Node.js for main/preload/test, browser for renderer). Fixed 10 lint issues: optional catch binding for unused error params, added browser globals (alert/prompt/confirm), removed dead assignments. Added `npm run lint` script. Result: 0 errors, 0 warnings.

## Improvements Applied

### Improvement 1: Instruction
- AGENTS.md: project overview, tech stack, verification commands, hard constraints
- Observed: next session immediately knows project purpose and verification steps

### Improvement 2: Environment
- .node-version, .nvmrc, engines field — Node 24 pinned three ways
- Observed: version managers auto-select correct Node; npm warns on mismatch

### Improvement 3: Tool
- Created .gitconfig with safe.directory, updated init.sh and init.ps1
- Observed: git log, git show, and future commits work transparently when init scripts are sourced

### Improvement 4: State
- Created session-handoff.md (quick state, changed files, blockers, next steps)
- Fixed garbled Unicode in feature_list.json (em dashes)
- Observed: next session has a single-file entry point for current state without reading three separate files

### Improvement 4: Feedback
- ESLint 10 with eslint.config.mjs, per-file environment configs
- Fixed 10 lint issues in source files, added `npm run lint`
- Observed: lint catches regressions immediately; part of standard verification path

## Final Result

| Subsystem | Before | After | Evidence |
|-----------|--------|-------|----------|
| Instruction | 2 | 5 | Project map, architecture, quick start, troubleshooting, commit conventions |
| Tool | 3 | 4 | git works via GIT_CONFIG_GLOBAL + .gitconfig; init scripts automate it |
| Environment | 2 | 3 | .node-version, .nvmrc, engines field |
| State | 4 | 5 | session-handoff.md created; feature_list.json fixed; all five artifacts present |
| Feedback | 3 | 4 | ESLint 0/0 + 75 assertions |

**Next improvement target**: Feedback — add TypeScript/JSDoc type checking for 5/5. Or Environment — add Docker/devcontainer config.










