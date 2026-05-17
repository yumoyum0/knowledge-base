# Exercise: Clean State Checklist

## Purpose
Design a session exit checklist for your codebase covering all five dimensions. Apply it across 5 consecutive sessions and record violations per dimension.

## Criteria for success
- Fully understand information from Links
- Clean State Checklist in AGENTS.md

## Links
- Clean State Checklist: [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## Clean Handoff at the End of Every Session"

## Results

### Checklist Design

A five-dimension session exit checklist was designed covering:

1. **Build**: Node version, npm install, dependency consistency
2. **Test**: npm test (200 assertions), lint, check-arch, verify umbrella
3. **Progress**: feature_list.json, PROGRESS.md, session-handoff.md, quality-document.md
4. **Artifact**: No debug code, stale files, contradictory docs; git status clean
5. **Startup**: init.ps1/init.sh works; next session needs no manual repair

The checklist is integrated into [AGENTS.md](../AGENTS.md) (Clean State Checklist section) with the full template and violation log in [clean-state-checklist.md](../clean-state-checklist.md).

### 5-Session Simulation

| Session | Build | Test | Progress | Artifact | Startup | Total |
|---------|-------|------|----------|----------|---------|-------|
| 1 | 0 | 0 | 2 | 3 | 0 | 5 |
| 2 | 0 | 0 | 1 | 1 | 0 | 2 |
| 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0 | 0 | 0 | 0 | 0 | 0 |

### Violations Found and Fixed

**Session 1** discovered 5 violations:
- AGENTS.md stale assertion count: 179 vs actual 200 (fixed)
- quality-document.md stale assertion counts: 145/171 vs actual 200 (fixed)
- quality-document.md Grounded Answers domain grade: "--" but kb-007 is passing (fixed)
- quality-document.md Persistence domain grade: "--" but kb-008 is passing (fixed)
- docs/session-checklist.md stale assertion count: 75/75 vs actual 200/200 (fixed)

**Session 2** discovered 2 residual violations in quality-document.md domain grades (fixed).

**Sessions 3-5**: Zero violations. Clean state confirmed.

### Files Modified
- AGENTS.md: Clean State Checklist section added, assertion count corrected
- clean-state-checklist.md: Replaced with five-dimension reusable template + violation log
- quality-document.md: Domain grades promoted, assertion counts corrected, change history updated
- docs/session-checklist.md: Stale assertion count corrected (75/75 -> 200/200)