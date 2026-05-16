# Exercise : Observability Gap Analysis

## Purpose
Audit your current harness for system-layer and process-layer observability. Find system states that can not be distinguished from existing signals, and propose additions.

## Criteria for success
- Fully understand information from Links
- Identify at least 6 distinct observability gaps across both layers with concrete code references
- For each gap, document what system state cannot be distinguished
- Propose concrete additions ranked by impact/effort ratio
- Verify that no proposed addition violates existing architectural constraints

## Links
- Observability: [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## Make the Agent'\''s Runtime Observable"

## Analysis Date
2026-05-16

## Current Observability Baseline

### Existing System-Layer Signals

| Signal | Source | What It Answers |
|--------|--------|-----------------|
| Test pass/fail per assertion | npm test -> test.js (179 assertions) | Do unit/integration tests pass? |
| Lint violations | npm run lint -> ESLint | Are there style/static errors? |
| Architectural violations | npm run check-arch -> scripts/check-arch.mjs | Does renderer import Node.js APIs? |
| Index status (visual) | Status bar in renderer | What is the current index state? (idle/indexing/ready/error) |
| Document count (visual) | Status bar in renderer | How many documents are loaded? |
| Data path (visual) | Status bar in renderer | Where is data stored? |
| Console output (test only) | console.log from test.js | What passed/failed during test run? |

### Existing Process-Layer Signals

| Signal | Source | What It Answers |
|--------|--------|-----------------|
| Feature status | feature_list.json | Which features are done/in-progress/not-started? |
| Session log | PROGRESS.md | What happened in past sessions (narrative)? |
| Session handoff | session-handoff.md | What was the last session'\''s state? |
| Quality grades | quality-document.md | What grade does each domain/layer have? |
| Task breakdown | BOOTSTRAP.md | What tasks remain? |
| Feature evidence | feature_list.json evidence array | What was verified for each feature? |

---

## System-Layer Gap Analysis

### Gap 1: Silent error swallowing masks data corruption

**What cannot be distinguished**: "No data exists" vs "Data is corrupt" vs "I/O error occurred."

**Evidence** -- 5 locations where catch blocks silently consume errors:

| File | Line Pattern | Problem |
|------|-------------|---------|
| src/services/PersistenceService.js:34 | catch { /* corrupt or empty */ } in readChunks() | Corrupt chunk JSON silently returns null |
| src/services/PersistenceService.js:54 | catch { /* corrupt or empty */ } in readIndexMeta() | Corrupt index meta silently returns default |
| src/services/QaService.js:45 | catch { /* corrupt or empty */ } in _loadHistory() | Corrupt history silently returns [] |
| src/main/main.js | catch { return []; } in data:list-files | Filesystem error indistinguishable from empty dir |
| src/main/main.js | catch { return null; } in data:read-file | Read error indistinguishable from empty file |

**Impact**: The app cannot detect or report data integrity problems. A corrupt qa-history.json produces the same behavior as an empty file -- the user sees an empty history with no indication anything is wrong. This violates the Harness Engineering principle that "runtime signals explain what happened."

**Proposed Addition**: Add a diagnostics IPC channel (diagnostics:check-integrity) that validates data files exist and parse correctly, returning a structured report distinguishing "missing," "valid," and "corrupt" for each data artifact.

### Gap 2: No crash-recovery detection for in-flight indexing

**What cannot be distinguished**: "Indexing completed normally" vs "Indexing crashed mid-operation."

**Evidence** -- src/main/main.js lines ~95-100 set globalStatus = '\''indexing'\'' before work begins:

```js
let indexMeta = persistence.readIndexMeta();
indexMeta.globalStatus = '\''indexing'\'';
indexMeta.documents[docName] = { status: '\''indexing'\'', chunkCount: 0 };
persistence.writeIndexMeta(indexMeta);
// ... if crash happens here, status stays '\''indexing'\'' forever
```

Both indexing:start-single and indexing:start-all have this pattern. The only recovery mechanism is the error catch block -- but a hard crash (process kill, power loss) bypasses all catch blocks.

**Impact**: After a crash, the status bar displays "Index: indexing" permanently for affected documents. No mechanism exists to detect or clear stale in-progress states.

**Proposed Addition**: Write a pid + timestamp to index meta before starting indexing. On next startup, if the stored PID does not match the current process, reset any documents stuck in indexing status to error with reason "indexing interrupted by previous session crash."

### Gap 3: No IPC invocation audit trail

**What cannot be distinguished**: "IPC channel X was never called" vs "IPC channel X was called and failed silently."

**Evidence** -- 13 IPC channels registered in src/main/main.js, none log invocation, arguments, or results:
- No timing information (how long did indexing:start-all take?)
- No error correlation (did data:import-file fail at the same time as indexing:get-status?)
- No invocation order (did the renderer call indexSingle before getChunks?)

**Impact**: When something goes wrong in production (user reports "indexing didn'\''t work"), there is zero diagnostic information to reconstruct what happened. The agent cannot self-diagnose failures.

**Proposed Addition**: Add a lightweight IPC audit log (data/ipc-audit.jsonl) recording { channel, ts, duration_ms, error } per invocation. Rotate at 1000 entries. Expose via diagnostics:get-ipc-log.

### Gap 4: No application lifecycle signals

**What cannot be distinguished**: "App started and initialized correctly" vs "App started but services failed to initialize" vs "App never started."

**Evidence** -- src/main/main.js lines 21-30 initializes services and creates window, but records nothing:

```js
const persistence = new PersistenceService(dataDir);
const indexingService = new IndexingService(persistence);
const qaService = new QaService(persistence, indexingService);
// No log that services initialized
```

The test suite (test.js) verifies code structure but never exercises the real Electron lifecycle. App launch verification is visual-only (open the window and look).

**Impact**: The only verification that the app "works" is a human looking at a window. The agent cannot programmatically confirm the app reached a ready state.

**Proposed Addition**: Write a data/app-lifecycle.json file on startup recording { pid, startTime, services: { persistence: true, indexing: true, qa: true }, windowCreated: true }. Write a shutdown timestamp on app.on('\''before-quit'\''). Expose via diagnostics:get-lifecycle.

### Gap 5: No data integrity verification (checksums)

**What cannot be distinguished**: "Stored data is identical to what was written" vs "Stored data was corrupted on disk."

**Evidence** -- All PersistenceService writes use atomic write-to-tmp-then-rename, which prevents partial writes but does not detect bit-rot or filesystem corruption after the fact:

```js
// PersistenceService.js writeChunks -- atomic but no checksum
fs.writeFileSync(tmpPath, JSON.stringify(chunks, null, 2), '\''utf-8'\'');
fs.renameSync(tmpPath, chunkPath);
```

**Impact**: Silent data corruption from hardware or filesystem errors would go undetected indefinitely. Combined with Gap 1 (silent catch), corrupt data would manifest as "empty results" rather than "data error."

**Proposed Addition**: Append a _checksum field (SHA-256 of content) to each persisted JSON object. On read, validate the checksum. On mismatch, log the error and surface via diagnostics:check-integrity.

### Gap 6: No resource utilization signals

**What cannot be distinguished**: "App is operating normally within resource bounds" vs "App is approaching resource exhaustion."

**Evidence** -- No tracking of:
- Disk space remaining in dataDir (imports could silently fail if disk is full)
- Memory usage of in-memory data structures (QaService holds full history in memory)
- Number of open file handles (PersistenceService opens files on every read/write)
- Chunk/index directory sizes (could grow unbounded)

**Impact**: The app could fail at runtime with no advance warning. A user importing documents until disk space runs out would get a cryptic error or silent failure.

**Proposed Addition**: Add diagnostics:get-resources returning { diskFreeMB, historyEntryCount, totalChunkCount, indexDirSizeBytes }. Display a warning in status bar when disk free < 100 MB.

### Gap 7: Indexing "error" state is ambiguous

**What cannot be distinguished**: "Indexing failed due to corrupt content" vs "Indexing failed due to disk full" vs "Indexing failed due to service bug."

**Evidence** -- src/main/main.js lines ~106-113 records only err.message without error categorization:

```js
indexMeta.documents[docName] = { status: '\''error'\'', error: _err.message };
```

Different root causes produce different recovery paths (corrupt content -> skip and continue; disk full -> stop and alert; bug -> report and retry), but the harness cannot distinguish them.

**Impact**: The agent (or user) cannot determine the correct recovery action. All errors look the same.

**Proposed Addition**: Add error categorization to indexing status: { status: '\''error'\'', errorType: '\''content'\'' | '\''io'\'' | '\''internal'\'', error: message }. IPC handlers catch specific error subtypes (ENOSPC for disk full, EACCES for permissions, SyntaxError for corrupt JSON) and tag accordingly.

---

## Process-Layer Gap Analysis

### Gap 8: No sprint contracts

**What cannot be distinguished**: "Feature was implemented as agreed" vs "Feature was implemented with undocumented scope changes."

**Evidence** -- feature_list.json defines what each feature should do, but there is no per-session negotiated contract stating:
- Which specific files will be modified
- What is explicitly excluded from scope
- What verification standard applies
- What the acceptance criteria are beyond "tests pass"

**Impact**: The harness cannot validate that the agent delivered what it agreed to deliver. This is the exact problem described in the Harness Engineering doc: "without sprint contracts, the generator might build something the evaluator rejects for foreseeable reasons."

**Proposed Addition**: Before starting each feature, write a contracts/kb-XXX-contract.md file containing: scope, modified files, verification standards, exclusions, and evaluator rubric. The agent and harness both reference this contract.

### Gap 9: No evaluator rubric

**What cannot be distinguished**: "A-grade implementation" vs "Barely-working implementation" vs "Technically correct but unmaintainable."

**Evidence** -- The test suite produces pass/fail only. There is no dimensional quality scoring:

| Dimension | Current Signal | Gap |
|-----------|---------------|-----|
| Code correctness | Tests pass/fail | No coverage measurement |
| Architecture compliance | check-arch passes | Only checks renderer, not services or main |
| Test thoroughness | Assertion count | No edge-case coverage analysis |
| Code clarity | ESLint passes | No complexity, duplication, or naming checks |
| Error handling | Not measured | No check that all catch blocks are intentional |

**Impact**: An agent could produce "passing" code that is fragile, untestable, or architecturally unsound, and the harness would accept it.

**Proposed Addition**: Extend quality-document.md with a per-feature evaluator rubric scored on 4 dimensions (correctness, architecture, thoroughness, clarity) using A-D scale. Run after each feature completion and record the score as evidence.

### Gap 10: No task decision trace

**What cannot be distinguished**: "Agent chose approach A for good reasons" vs "Agent chose approach A because it did not consider approach B."

**Evidence** -- PROGRESS.md and session-handoff.md record WHAT was done, not WHY:

```
// From session-handoff.md -- records outcome, not reasoning
kb-007 (Grounded Q&A with citations) completed in 6 atomic units:
1. QaService -- chunk retrieval + answer generation
```

No record exists of: "Why keyword-based retrieval instead of embedding-based?" or "Why 3 top chunks instead of 5?" or "Why 0.85/0.30 confidence thresholds?"

**Impact**: When the next session needs to modify Q&A behavior, it must reverse-engineer the reasoning behind existing decisions. The Harness Engineering doc estimates this redundant diagnosis consumes 30-50% of session time.

**Proposed Addition**: Add a decisions/ directory. For each non-trivial implementation decision, write a brief decisions/XXX-decision-log.md entry with: context, options considered, chosen approach, and rationale.

### Gap 11: No structured completion evidence

**What cannot be distinguished**: "Feature passed all three verification layers" vs "Feature passed unit tests only."

**Evidence** -- feature_list.json evidence is free-form text with no structure:

```json
"evidence": [
  "2026-05-14: Unit 1 - QaService created with keyword-based chunk retrieval...",
  "2026-05-14: Test 12 added with 26 assertions; 171 total pass; lint clean."
]
```

The AGENTS.md Definition of Done specifies three verification levels (unit -> integration -> e2e), but the evidence array does not track which levels were satisfied.

**Impact**: A feature might be marked "passing" after only unit tests pass, even though integration or e2e tests were never written.

**Proposed Addition**: Restructure feature_list.json evidence to use structured entries: { date, layer: "unit"|"integration"|"e2e", description, assertions, result: "pass"|"fail" }. The verification script validates that all three layers have passing evidence before marking a feature complete.

### Gap 12: Session handoff information cliff

**What cannot be distinguished**: "Session ended cleanly with all verification passing" vs "Session ended mid-task with dangling state."

**Evidence** -- session-handoff.md is manually updated and narrative. It does not capture:
- Git diff at session end (exactly what changed)
- Which test assertions were added/modified
- Whether verification passed at session end
- Any dangling state (in-progress CRUD operations, tmp files, partial writes)

**Impact**: The next session must re-verify baseline before starting work, but cannot distinguish "verification passed at session end" from "verification was broken before this session."

**Proposed Addition**: Add a session-handoff.json (machine-readable) containing: { endedAt, gitHeadSha, verifyPassed: bool, assertionCount, lintClean: bool, danglingState: [] }. The session-checklist.md workflow prompts the agent to run npm run verify and update this file.

---

## Proposed Additions -- Prioritized by Impact/Effort

| Priority | Gap | Addition | Impact | Effort | Files Affected |
|----------|-----|----------|--------|--------|---------------|
| 1 | #1 | Diagnostics IPC: data integrity check | Prevents silent data loss | Low | main.js, preload.js, new: diagnostics IPC handler |
| 2 | #2 | Crash-recovery PID tracking in index meta | Prevents permanent indexing state | Low | main.js, IndexingService.js |
| 3 | #8 | Sprint contracts for each feature | Reduces scope ambiguity, front-loads alignment | Medium | new: contracts/ directory |
| 4 | #9 | Evaluator rubric per feature | Makes quality assessment reproducible | Medium | quality-document.md |
| 5 | #4 | App lifecycle signal file | Confirms app reaches ready state programmatically | Low | main.js |
| 6 | #11 | Structured completion evidence | Enforces three-layer termination validation | Medium | feature_list.json, test.js |
| 7 | #3 | IPC audit trail (JSONL) | Enables post-mortem diagnosis | Medium | main.js, preload.js |
| 8 | #5 | Checksums on persisted data | Detects bit-rot and filesystem corruption | Low | PersistenceService.js |
| 9 | #7 | Error categorization in indexing | Enables correct recovery actions | Low | main.js, IndexingService.js |
| 10 | #6 | Resource utilization signals | Prevents silent resource exhaustion | Medium | main.js, preload.js, renderer.js |
| 11 | #10 | Decision log directory | Reduces session-to-session redundant diagnosis | Low | new: decisions/ directory |
| 12 | #12 | Machine-readable session handoff | Eliminates manual handoff guesswork | Low | session-handoff.json, session-checklist.md |

---

## Key Findings

**Most critical**: The silent error swallowing pattern (Gap 1) combined with the lack of crash recovery (Gap 2) means the harness cannot detect or recover from its most common failure modes. These are the highest-ROI fixes because they prevent data loss.

**Highest leverage**: Sprint contracts (Gap 8) and evaluator rubrics (Gap 9) are process-layer additions that would change agent behavior before coding starts. The Harness Engineering doc shows a 3x efficiency improvement from these alone.

**Architectural note**: All proposed system-layer additions (IPC channels, lifecycle files, audit logs) follow the existing namespace:action IPC pattern and write to data/ within the established dataDir boundary. No architectural constraints are violated.
