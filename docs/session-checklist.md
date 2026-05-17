# Session Checklist

**Source**: AGENTS.md — extracted to reduce noise during non-handoff tasks.
**Applies when**: Ending a session, preparing for handoff, or verifying that all artifacts are current.
**Expires if**: The project adopts automated state management (CI-driven progress tracking).

## Required Artifacts

These five files are the project's state backbone. All must be current before handoff:

| Artifact | Purpose |
|----------|---------|
| `feature_list.json` | Source of truth for feature state |
| `PROGRESS.md` | Session log and current verified status |
| `init.sh` / `init.ps1` | Standard startup and verification path |
| `quality-document.md` | Quality grades per domain and layer |
| `session-handoff.md` | Compact handoff for larger sessions |

## Definition Of Done

A feature is done only when all of the following are true:

- the target behavior is implemented
- the required verification actually ran (`npm test` passes)
- evidence is recorded in `feature_list.json` or `PROGRESS.md`
- the repository remains restartable from the standard startup path

## End Of Session

Before ending a session:

1. Update `PROGRESS.md` — record actions taken, current state, verification evidence.
2. Update `feature_list.json` — bump `last_updated`, update feature statuses, add evidence entries.
3. Update `quality-document.md` — promote/demote grades, document new gaps, record change history.
4. Record any unresolved risk or blocker — in `PROGRESS.md` Known Limitations.
5. Commit with a descriptive message once the work is in a safe state.
   Format: `area: short description — status` (see AGENTS.md Commit Conventions).
6. Leave the repo clean enough for the next session to run `init.sh` or `init.ps1` immediately.

## Quick Check

Before committing, run:
```bash
npm test && npm run lint
```
Both must pass (200/200, 0/0). If either fails, fix before committing.
