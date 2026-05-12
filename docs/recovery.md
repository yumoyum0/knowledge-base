# Recovery Procedures

**Source**: AGENTS.md — extracted for progressive disclosure.
**Applies when**: Baseline verification fails, tests regress, or dependencies are corrupted.
**Expires if**: The project adopts automated recovery (CI-driven reset).

## Broken Baseline on Startup

If `npm test` or `npm run lint` fails when you first run init:

1. Check what changed: `git status`
2. Revert unintended changes: `git checkout -- .`
3. Re-run init: `./init.sh` or `./init.ps1`

## Test Failures After Own Changes

- Check for stale test artifacts: `rm data/__test_kb004.md`
  (test.js Test 9 creates and cleans this file; a crashed run may leave it behind)
- Re-run: `npm test`

## Corrupted Dependencies

- Delete and reinstall: `rm -rf node_modules && npm install`
- Re-run: `npm test && npm run lint`
