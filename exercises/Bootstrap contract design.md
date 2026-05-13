# Exercise 4-1: Bootstrap contract design

## Purpose
Write a complete bootstrap contract for a project you're developing. Then open a completely fresh agent session, show it only repo contents (no verbal context), and have it try to start the project, run tests, and understand current progress. Record every problem it encounters — each one corresponds to a missing clause in your bootstrap contract.

## Criteria for success
- Fully understand information from Links
- A bootstrap contract is completed
- Problems recorded and mapped to missing clauses
- Bootstrap contract improved based on findings

## Links
- Bootstrap contract: [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## Initialize Before Every Agent Session"
- Bootstrap contract output: [BOOTSTRAP.md](../BOOTSTRAP.md)

## Example

From Harness Engineering — the target format for an initialization contract:

```
# Initialization Contract

## Start Commands
- Install dependencies: `make setup`
- Start dev server: `make dev`
- Run tests: `make test`
- Full verification: `make check`

## Current State
- All dependencies installed and locked
- Test framework configured (Vitest + React Testing Library)
- Example test passing (1/1)
- Lint rules configured (ESLint + Prettier)

## Project Structure
- src/ — Source code
- src/components/ — React components
- src/api/ — API client
- tests/ — Test files
```

This project's BOOTSTRAP.md follows this format, extended with a feature status table, file hints per feature, and platform-specific git workaround instructions.

## Results
- Time to First Verification: ~5 seconds (`npm test` returns immediately with 143 assertions)

## Problem record

### Problem 1: Node.js version check unclear
A fresh agent reading only repo contents sees `.node-version` and `.nvmrc` but may not know whether the environment already has Node 24.x. If the wrong version is active, `npm install` silently works but Electron may fail at runtime with cryptic errors.
**Resolution**: Added explicit prerequisite line to AGENTS.md Quick Start and BOOTSTRAP.md Start Commands: "Prerequisite: Node.js 24.x (`node --version` — must show v24.x)."

### Problem 2: Git ownership on Windows
The `init.ps1` script sets `GIT_CONFIG_GLOBAL` to work around the dubious-ownership issue, but a fresh agent running individual git commands (not the init script) hits the error immediately. The AGENTS.md mentioned the workaround only in the Troubleshooting section.
**Resolution**: Added explicit git workaround commands (both PowerShell and bash) to BOOTSTRAP.md Start Commands section, placed before any git-dependent steps. AGENTS.md Git Note already covers this, but BOOTSTRAP.md now duplicates it prominently.

### Problem 3: No explicit order-of-operations for first session
AGENTS.md has a "Startup Workflow" with 7 steps, but no single command handles all of them. A fresh agent must manually execute each step.
**Resolution**: Added `npm run verify` script to package.json (runs `npm run lint && npm test`) and listed it as the first verification command in AGENTS.md. Step 7 of Startup Workflow now says `npm run verify` instead of referring to separate commands.

### Problem 4: feature_list.json is the progress authority, but not stated explicitly
AGENTS.md listed feature_list.json as doc #3, but didn't explain it's the authoritative status tracker. A fresh agent might read PROGRESS.md instead and miss the single-source-of-truth.
**Resolution**: Updated AGENTS.md docs hierarchy table — entry 3 now says "**Canonical** feature status (authoritative over PROGRESS.md)." Added explicit statement after table: "feature_list.json is the canonical source of truth for feature status. PROGRESS.md is the narrative session log. When they disagree, feature_list.json wins." Same statement added to BOOTSTRAP.md Current State section.

### Problem 5: No guidance on which files to touch for a feature
After choosing the next feature, a fresh agent needs to know which files are involved. feature_list.json had no file mapping.
**Resolution**: Added `files` array to kb-007 and kb-008 entries in feature_list.json, listing the primary files to create or modify. BOOTSTRAP.md Current State table now includes a "Primary Files" column. Task Breakdown table also includes "Primary Files" per task.

### Problem 6: Services directory README was generic
`src/services/README.md` was a generic layer description. A fresh agent couldn't tell which services exist versus which are planned.
**Resolution**: Rewrote `src/services/README.md` with two explicit tables: "Implemented" (IndexingService, PersistenceService with file names and purposes) and "Planned" (DocumentService, QaService with purposes). Each row includes the exact filename.

## Missing clause in bootstrap contract

The most impactful missing clause was **Problem 4**: the lack of an explicit statement that `feature_list.json` is the authoritative progress artifact. This caused downstream ambiguity — an agent reading PROGRESS.md could make decisions on stale narrative prose rather than structured status data.

Applied fix to both AGENTS.md and BOOTSTRAP.md:
> `feature_list.json` is the canonical source of truth for feature status. `PROGRESS.md` is the narrative session log. When they disagree, `feature_list.json` wins.

## Improvement

[BOOTSTRAP.md](../BOOTSTRAP.md) updated with all 6 resolutions:

1. Explicit Node.js 24.x prerequisite in Start Commands
2. Git workaround commands (PowerShell + bash) in Start Commands, not buried in troubleshooting
3. `npm run verify` as single-command baseline check, referenced throughout
4. Canonical progress authority statement duplicated in both AGENTS.md and BOOTSTRAP.md
5. Primary Files column in Current State and Task Breakdown tables; `files` arrays in feature_list.json for kb-007/kb-008
6. Services README rewritten with Implemented vs Planned tables

Supporting changes:
- `package.json`: added `"verify": "npm run lint && npm test"` script
- `AGENTS.md`: updated assertion count (75→143), added verify command, prerequisite note, canonical authority statement
- `feature_list.json`: added `files` hints to kb-007 and kb-008
- `src/services/README.md`: replaced generic description with specific service inventory

The bootstrap contract now answers all five cold-start questions from a single file: what is this, how to run, how to test, what's done, what's next.
