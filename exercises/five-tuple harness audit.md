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

**After**: AGENTS.md (55 lines). Added Project section (one-sentence purpose + tech stack with versions), Verification Commands table, Hard Constraints section, Further Reading links. Fixed duplicate step numbering in End Of Session and reordered commit step.

### 2. Tool Subsystem — Score: 3

Shell, file ops, apply_patch, npm all functional. `git log` broken due to repository ownership mismatch (current user S-1-5-21-...-1022 vs owner S-1-5-21-...-1001) and locked global gitconfig. Does not block core workflow but prevents commit history inspection and new commits.

### 3. Environment Subsystem — Score: 2

`package.json` exists with Electron 33 dependency. `init.sh` provides setup path. Missing: `.node-version` or `.nvmrc` to pin Node version, no Docker/devcontainer for reproducibility.

### 4. State Subsystem — Score: 4

`claude-progress.md` is detailed with session log, verification evidence, known limitations, and next steps. `feature_list.json` is well-structured with status tracking, evidence recording, and rules. `quality-document.md` tracks quality grades per domain and layer. Only gap: `session-handoff.md` mentioned but not implemented.

### 5. Feedback Subsystem — Score: 3

`npm test` runs 75 assertions covering all implemented features. `init.sh` includes npm test as baseline verification. Missing: linting (ESLint), type checking, and the verification commands were not explicit in AGENTS.md (now fixed via Instruction improvement).

## Improvement Applied

**Target**: Instruction subsystem (lowest initial score: 2/5).

**Change**: Enhanced AGENTS.md from 41 to 55 lines, adding:
- Project section: one-sentence purpose, tech stack (Node.js 24, Electron 33)
- Verification Commands table with explicit npm test / node --version / npm install
- Hard Constraints section (contextIsolation, path validation, basename sanitization, minimal preload surface)
- Further Reading links to Harness Engineering.md and exercises/
- Fixed End Of Session numbering (had two step 4s)
- Clarified Windows alternative for init.sh

**Observed change**: The next session immediately had the tech stack and verification commands available without guessing. The agent could confirm Node version requirement and run the correct verification without reading multiple files.

## Result

| Subsystem | Before | After | Evidence |
|-----------|--------|-------|----------|
| Instruction | 2 | 3 | AGENTS.md now includes project overview, tech stack, verification commands, hard constraints |
| Tool | 3 | 3 | git ownership issue persists, otherwise functional |
| Environment | 2 | 2 | No change — .node-version still missing |
| State | 4 | 4 | Already strong |
| Feedback | 3 | 3 | 75 assertions passing; verification commands now surfaced in AGENTS.md |

**Next improvement target**: Environment subsystem — add `.node-version` (Node 24) and consider `.nvmrc` for cross-platform version pinning.
