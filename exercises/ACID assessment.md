# Exercise: ACID assessment

## Purpose
Evaluate your project's state management using ACID analogy. Atomicity — can agent operations be cleanly rolled back? Consistency — is there "consistent state" verification? Isolation — do concurrent agents step on each other? Durability — is all cross-session knowledge persisted?

## Criteria for success
- All four ACID dimensions are assessed with score (A-D) and concrete evidence.
- The weakest dimension is identified and improved.
- Improvements are recorded with before/after evidence.

## Links
- ACID: [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## How to Draw a Good Map / ### Managing Agent State with ACID Principles"

## Assessment (2026-05-12)

### Atomicity — Score: B → B+

Can agent operations be cleanly rolled back?

**Evidence for:**
- `single_active_feature: true` in feature_list.json prevents multi-feature partial work
- Git provides full rollback (`git reset --hard`, `git checkout`)
- End-of-session checklist requires clean state before commit
- `npm test` + `npm run lint` catch regressions before they're committed

**Evidence against:**
- No documented recovery procedure for a new agent arriving to a broken state
- Startup Workflow says "fix that first" but doesn't say how

**Improvement applied:** Added Recovery section to AGENTS.md with concrete rollback steps (git reset, re-run init, check for stale test artifacts).

---

### Consistency — Score: A

Is there "consistent state" verification?

**Evidence:**
- `npm test`: 75 assertions covering all layers (data, HTML, renderer, preload, main, CRUD)
- `npm run lint`: ESLint 0/0 across all source files
- `init.sh` / `init.ps1` enforce verification before any work begins
- `feature_list.json` rules: `passing_requires_evidence`, `do_not_skip_verification`
- Definition of Done requires verification actually ran
- Hard Constraints documented and mechanically enforced (contextIsolation, path.basename, dataDir validation)
- `node --version` check ensures correct runtime

**Verdict:** Multiple layers of consistency verification. No gaps identified.

---

### Isolation — Score: B

Do concurrent agents step on each other?

**Evidence for:**
- `single_active_feature: true` prevents feature-level overlap
- Sequential session model (one agent per session)
- `feature_list.json` explicitly tracks which feature is `in_progress`
- Git-based VCS provides merge conflict resolution at the file level

**Evidence against:**
- No programmatic enforcement of `single_active_feature` — it's a convention
- No session-activity marker to signal "agent currently working"
- If two agents ran simultaneously, they could both read feature_list.json before either writes

**Verdict:** Safe for the current single-agent model. Would need locking for true concurrency (out of scope for this project).

---

### Durability — Score: A

Is all cross-session knowledge persisted?

**Evidence:**
- PROGRESS.md: full session log with state, actions, limitations, next steps
- feature_list.json: structured feature tracking with status and evidence
- quality-document.md: quality grades per domain and layer with change history
- session-handoff.md: compact single-file handoff for quick orientation
- Knowledge externalization at 100% (20/20 items in repo)
- Cold-start test: all five questions answerable from repo alone
- End-of-session checklist in AGENTS.md enforces updates to all state files
- Source code headers document IPC contract, API surface, and test architecture

**Verdict:** Comprehensive. No gaps identified.

---

## Improvement Applied: Atomicity

Added a **Recovery** section to AGENTS.md with three concrete recovery paths:

1. **Broken baseline** — `git status` to assess, `git checkout -- .` to revert, re-run init
2. **Stale test artifacts** — clean up `__test_kb004.md` if left from crashed test run
3. **Dependency corruption** — delete `node_modules/` and re-run `npm install`

This closes the gap between "fix that first" (vague) and knowing exactly how to fix common failure modes.

## Results

| Dimension | Score | Key Evidence |
|-----------|-------|-------------|
| Atomicity | B → B+ | Recovery section added to AGENTS.md; git + init scripts provide rollback |
| Consistency | A | 75 assertions + ESLint + init enforcement + DoD checklist |
| Isolation | B | single_active_feature convention; adequate for single-agent model |
| Durability | A | 5 state files + 100% knowledge externalization + cold-start passes |

**Strongest:** Consistency and Durability (both A).
**Weakest:** Atomicity and Isolation (both B-range). Atomicity improved this session.
