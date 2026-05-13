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

## Results
- Time to First Verification: ~5 seconds (`npm test` returns immediately with 143 assertions)

## Problem record

### Problem 1: Node.js version check unclear
A fresh agent reading only repo contents sees `.node-version` and `.nvmrc` but may not know whether the environment already has Node 24.x. If the wrong version is active, `npm install` silently works but Electron may fail at runtime with cryptic errors.
**Missing clause**: Explicit prerequisite check (e.g., `node --version` must show v24.x before proceeding).

### Problem 2: Git ownership on Windows
The `init.ps1` script sets `GIT_CONFIG_GLOBAL` to work around the dubious-ownership issue, but a fresh agent running individual git commands (not the init script) hits the error immediately. The AGENTS.md mentions the workaround but it's in the Troubleshooting section — a fresh agent may not read it until after failing.
**Missing clause**: Git workaround should be in the start commands section, not just troubleshooting.

### Problem 3: No explicit order-of-operations for first session
AGENTS.md has a "Startup Workflow" with 7 steps. But there's no single command that handles all of them. A fresh agent must manually execute each step. If the agent skips step 3 ("read docs/PRODUCT.md") or step 6 ("run init script"), subsequent behavior degrades.
**Missing clause**: A single `make check` or `npm run verify` command that chains all startup steps. Currently init scripts exist but don't enforce reading order.

### Problem 4: feature_list.json is the progress authority, but AGENTS.md doesn't say so explicitly
AGENTS.md lists feature_list.json as doc #3 in the hierarchy, but doesn't explain that it's the *authoritative* status tracker. A fresh agent might read PROGRESS.md instead (which is prose, not structured data) and miss the single-source-of-truth status.
**Missing clause**: Explicit statement that feature_list.json is the canonical progress artifact and PROGRESS.md is the narrative log.

### Problem 5: No guidance on which feature to pick after verification
After running `npm test` and confirming 143 pass, a fresh agent needs to know what to work on next. feature_list.json shows "not_started" for kb-007/kb-008, but AGENTS.md says "choose the highest-priority unfinished feature" — this is clear enough, but there's no mapping from feature ID to code locations (which files to touch).
**Missing clause**: Each feature entry in feature_list.json should include a `files` hint listing the primary files affected.

### Problem 6: Services directory has no README explaining what's already built
`src/services/` contains IndexingService.js and PersistenceService.js, but its README.md is a generic layer description. A fresh agent won't know which services exist, what they do, or that DocumentService and QaService haven't been extracted yet.
**Missing clause**: Services README should list implemented vs. planned services with one-line descriptions.

## Missing clause in bootstrap contract

The most impactful missing clause is **Problem 4**: the lack of an explicit statement that `feature_list.json` is the authoritative progress artifact. This is a single-line fix in AGENTS.md:

> `feature_list.json` is the canonical source of truth for feature status. PROGRESS.md is the narrative session log. When they disagree, feature_list.json wins.

## Improvement

Added [BOOTSTRAP.md](../BOOTSTRAP.md) containing:
1. Start commands with platform variants
2. Current state table (all 8 features with status)
3. Full project structure tree
4. Task breakdown with acceptance criteria
5. Known gotchas (git ownership, headless Electron, path separators)

The bootstrap contract replaces the need for an agent to assemble startup knowledge from 4+ separate documents. A fresh session can read BOOTSTRAP.md alone and answer all five cold-start questions: what is this, how to run, how to test, what's done, what's next.
