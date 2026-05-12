# Working Conventions

**Source**: AGENTS.md — extracted for progressive disclosure.
**Applies when**: Writing code, choosing scope, or preparing commits.
**Expires if**: The project adopts automated enforcement of these rules.

## Working Rules

- Work on one feature at a time.
- Do not mark a feature complete just because code was added.
- Keep changes within the selected feature scope unless a blocker forces a
  narrow supporting fix.
- Do not silently change verification rules during implementation.
- Prefer durable repo artifacts over chat summaries.

## Commit Conventions

```
kb-XXX: short description — status
```

Examples:
- `kb-004: document management — create, edit, delete with path safety — passing`
- `harness: add ESLint; fix lint issues in main.js — feedback 3->4`
