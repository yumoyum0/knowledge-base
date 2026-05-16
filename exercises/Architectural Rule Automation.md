# Exercise: Architectural Rule Automation

## Purpose
Pick an architectural constraint from your project and turn it into an executable check (with an agent-oriented error message). Integrate it into the harness and verify its effectiveness with a baseline task

## Criteria for success
- Fully understand information from Links
- Executable check catches violations with agent-oriented error messages
- Check integrated into npm run verify pipeline
- Verification confirms detection and clean-pass states

## Links
- [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## Only End-to-End Testing is True Verification"

## Plan

### Step 1: Select the architectural constraint

**Constraint**: "Renderer must never directly import/require Node.js built-in modules. All system access must go through the preload bridge (window.kbAPI)."

Rationale: This is the foundational Electron security invariant, non-negotiable per AGENTS.md ("contextIsolation: true, nodeIntegration: false -- never relax"). It has clear executable criteria via static analysis.

### Step 2: Design the executable check

Script: scripts/check-arch.mjs

Scans for:
1. require('node-builtin') in renderer files
2. import ... from 'node-builtin' in renderer files (future TypeScript)
3. Direct require('electron') in renderer

Agent-oriented error format per violation:
- WHAT: filename, line number, and matching code
- WHY: the architectural rule and security risk
- HOW: specific fix steps showing correct preload bridge pattern

Exit code: 0 (clean) or 1 (violations found)

### Step 3: Integrate into harness

- Add "check-arch": "node scripts/check-arch.mjs" to package.json
- Update npm run verify: npm run lint && npm run check-arch && npm test
- Add test assertions for the check script
- Update AGENTS.md verification command table

### Step 4: Verify

1. Run npm run check-arch on clean codebase -> 0 violations
2. Inject a deliberate violation -> confirm caught with agent-oriented message
3. Remove violation, run npm run verify -> full pipeline passes

## Architectural constraint

**Selected constraint**: Renderer process must never directly import or require Node.js built-in modules.

From AGENTS.md:
> **Electron security**: contextIsolation: true, nodeIntegration: false -- never relax.

From ARCHITECTURE.md layer diagram:
> **Renderer**: Communicates exclusively through window.knowledgeBase API. Never imports Node.js modules.

Scope of built-in modules checked: fs, path, electron, child_process, os, crypto, http, https, net, stream, util, buffer, process.

## Integration

### New files
- scripts/check-arch.mjs -- architectural rule checker

### Modified files
- package.json -- add check-arch script; update verify pipeline
- AGENTS.md -- update verification commands table
- test.js -- add architectural check assertions (Test 13, 8 assertions)

### Integration points
- npm run verify now runs: lint -> check-arch -> test (all must pass via &&)
- Compatible with the Definition of Done three-layer validation

## Verify

- [x] npm run check-arch passes on clean codebase (0 violations)
- [x] Deliberate violation is detected with agent-oriented error message
- [x] npm run verify passes full pipeline (179/179 tests, 0 lint errors)
- [x] npm test updated with new assertion (179 total, 8 for Test 13)
- [x] npm run lint clean
