# Clean State Checklist

Five-dimension session exit checklist from the Harness Engineering model.
Run at the end of every session before committing. All five dimensions must
pass before the session is considered complete.

**Last template update**: 2026-05-17

---

## 1. Build Dimension

Does the project build and install without errors?

- [ ] `node --version` is 24.x (currently v24.15.0)
- [ ] `npm install` completes without errors
- [ ] `package.json` dependencies are consistent with `node_modules/`
- [ ] No peer dependency warnings or deprecated package warnings

## 2. Test Dimension

Do all tests and quality checks pass?

- [ ] `npm test` passes with 0 failures (currently 200 assertions)
- [ ] `npm run lint` passes with 0 errors, 0 warnings
- [ ] `npm run check-arch` passes with 0 forbidden imports
- [ ] `npm run verify` passes (umbrella command)
- [ ] Test count in AGENTS.md and quality-document.md matches actual test output

## 3. Progress Dimension

Is current progress recorded in machine-readable artifacts?

- [ ] `feature_list.json` `last_updated` reflects current date
- [ ] `feature_list.json` feature statuses match test coverage
- [ ] `PROGRESS.md` has entry for current session
- [ ] `PROGRESS.md` "Next Features" table is accurate
- [ ] `session-handoff.md` is updated
- [ ] `quality-document.md` reflects current grades and assertion counts

## 4. Artifact Dimension

Are there stale or ambiguous temporary artifacts?

- [ ] No `console.log`, `debugger`, or `TODO` in `src/` or `test.js`
- [ ] No `.tmp`, `.log`, or backup files outside `.gitignore`
- [ ] No commented-out code blocks without explanatory comments
- [ ] No duplicate or contradictory documentation
- [ ] `git status` is clean (only intentional working files)
- [ ] No stale test data in `data/` beyond sample documents

## 5. Startup Dimension

Is the standard startup path available?

- [ ] `./init.ps1` or `./init.sh` succeeds end-to-end
- [ ] A fresh agent session can answer "how to run" and "how to test" from repo alone
- [ ] `AGENTS.md` Quick Start commands are correct and tested
- [ ] All doc links in `AGENTS.md` resolve to existing files
- [ ] `BOOTSTRAP.md` is current
- [ ] No manual repair steps needed before next session can begin

---

## Violation Log

Record violations per dimension across consecutive sessions. Goal: zero
violations at session exit.

| Session | Date | Build | Test | Progress | Artifact | Startup | Total | Notes |
|---------|------|-------|------|----------|----------|---------|-------|-------|
| 1 | 2026-05-17 | 0 | 0 | 2 | 3 | 0 | 5 | Initial sweep found stale assertion counts + outdated domain grades |
| 2 | 2026-05-17 | 0 | 0 | 1 | 1 | 0 | 2 | After fixing AGENTS.md, quality-doc still had issues |
| 3 | 2026-05-17 | 0 | 0 | 0 | 0 | 0 | 0 | All dimensions green |
| 4 | 2026-05-17 | 0 | 0 | 0 | 0 | 0 | 0 | All dimensions green |
| 5 | 2026-05-17 | 0 | 0 | 0 | 0 | 0 | 0 | All dimensions green |

---

## Session Detail

### Session 1 — 2026-05-17

**Build**: PASS (0 violations)
- Node v24.15.0, npm install clean

**Test**: PASS (0 violations)
- 200/200 assertions, 0 failures. ESLint clean. check-arch clean.

**Progress**: 2 violations
- VIOLATION: `AGENTS.md` says "179 assertions" but actual is 200 (stale from before kb-008)
- VIOLATION: `quality-document.md` Product Domains table assertion counts outdated (145 vs 200)

**Artifact**: 3 violations
- VIOLATION: `quality-document.md` Product Domain "Grounded Answers" shows grade "--" but kb-007 is passing
- VIOLATION: `quality-document.md` Product Domain "Persistence" shows grade "--" but kb-008 is passing
- VIOLATION: `docs/session-checklist.md` assertion reference outdated (says "75/75")

**Startup**: PASS (0 violations)

### Session 2 — 2026-05-17

**Progress**: 1 violation
- VIOLATION: `quality-document.md` domain grades still not promoted for kb-007 and kb-008

**Artifact**: 1 violation
- VIOLATION: `docs/session-checklist.md` Quick Check section still says "75/75"

### Sessions 3–5 — 2026-05-17

All five dimensions green. Zero violations. Project is in clean state.

---

## Reference: Five-Dimension Model

From [data/Harness Engineering.md](data/Harness%20Engineering.md), "Clean Handoff at the End of Every Session":

- **Build**: Does the code build without errors?
- **Test**: Do all tests pass? Verified in CI, not "works on my machine."
- **Progress**: Is current progress recorded in a machine-readable artifact?
- **Artifact**: Are there stale or ambiguous temporary artifacts?
- **Startup**: Is the standard startup path available?

Clean state = all five conditions satisfied. Missing any one means the session isn't "done."
