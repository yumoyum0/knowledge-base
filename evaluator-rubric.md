# Evaluator Rubric

A dimensional scoring framework for assessing feature implementation quality. Use this rubric after each feature completion to produce a structured, reproducible evaluation. Different evaluators (human or agent) should produce similar scores for the same output.

**Grading scale** (same as quality-document.md):

| Grade | Meaning |
|-------|---------|
| A | All criteria met, no gaps |
| B | Criteria mostly met, minor gaps |
| C | Partially met, known issues |
| D | Not met, or major problems |
| -- | Not applicable / not evaluated |

---

## Scoring Dimensions

### 1. Code Correctness

Does the implementation behave as specified?

| Grade | Criteria | Evidence Required |
|-------|----------|-------------------|
| A | All unit, integration, and e2e tests pass. All edge cases covered. No known behavioral bugs. | `npm test` passes with feature-specific assertions. Manual flow verification completed. |
| B | All tests pass. Main flow works. Minor edge cases may be untested but documented. | `npm test` passes. At least one edge case identified as untested in evidence. |
| C | Core tests pass. At least one known behavioral gap or flaky test. | `npm test` passes but a gap is documented. Or one test is skipped/disabled. |
| D | Tests fail, or core behavior does not match spec. | `npm test` fails. Or spec behavior is missing. |

**Checklist**:
- [ ] Feature-specification behaviors all implemented
- [ ] All three verification layers (unit, integration, e2e) exercised
- [ ] No skipped or disabled tests without documented reason
- [ ] Error paths produce correct error shapes (`{ error: string }` per IPC contract)

---

### 2. Architecture Compliance

Does the implementation respect layer boundaries and security constraints?

| Grade | Criteria | Evidence Required |
|-------|----------|-------------------|
| A | All layer boundaries respected. IPC follows `namespace:action` pattern. Preload surface is minimal. No new forbidden imports. | `npm run check-arch` passes. Manual review confirms no boundary violations. |
| B | Boundaries mostly respected. One minor deviation with documented justification. | `npm run check-arch` passes. Deviation documented in code comment or decisions log. |
| C | One or more boundary violations without justification. | `npm run check-arch` may still pass (only checks renderer). Violation found in services or main layer. |
| D | `contextIsolation` or `nodeIntegration` relaxed. Direct Node.js import in renderer. | `npm run check-arch` fails. |

**Checklist**:
- [ ] Renderer communicates only through `window.kbAPI` (no direct Node.js imports)
- [ ] New IPC channels follow `namespace:action` naming (e.g., `diagnostics:check-integrity`)
- [ ] Preload only adds methods when a new IPC channel is necessary
- [ ] All renderer-provided paths validated against `dataDir` in main process
- [ ] `contextIsolation: true`, `nodeIntegration: false` unchanged in BrowserWindow config

---

### 3. Error Handling

Are errors caught, categorized, and surfaced appropriately? (See also: Observability Gap Analysis, Gaps 1 and 7.)

| Grade | Criteria | Evidence Required |
|-------|----------|-------------------|
| A | All error paths caught with specific handling. Errors categorized by type. No silent catches. Recovery actions appropriate per error type. | Code review confirms every `catch` block does something meaningful. Error categorization present (e.g., `content` vs `io` vs `internal`). |
| B | All error paths caught. Some catches are generic (fallback to default) but documented as intentional. | Code review confirms no uncaught promise rejections. Generic catches have comments explaining the fallback. |
| C | Some error paths unhandled or silently swallowed. At least one `catch {}` with no action. | Code review finds at least one silent catch not documented as intentional. |
| D | Uncaught exceptions possible. `catch {}` used as primary error-handling strategy. | Code review finds multiple silent catches or missing error paths. |

**Checklist**:
- [ ] Every `catch` block either: logs the error, returns a structured error to caller, recovers, or has a documented reason for silence
- [ ] Corrupt data produces a distinguishable result from "no data" (not just `null` / `[]`)
- [ ] Indexing errors categorized: `content` (bad input), `io` (disk/permissions), `internal` (code bug)
- [ ] IPC handlers return `{ error: message }` shape on failure, never throw across process boundary
- [ ] Tmp files from atomic writes are cleaned up even on error paths

---

### 4. Test Thoroughness

Do tests cover main flows and edge cases adequately?

| Grade | Criteria | Evidence Required |
|-------|----------|-------------------|
| A | Happy path + error path + edge cases tested. Assertions verify behavioral correctness, not implementation details. Test structure matches feature spec. | All three categories (happy, error, edge) have at least one assertion each. New test block follows existing pattern (numbered Test N). |
| B | Happy path + error path tested. Edge cases documented but not all tested. | Happy and error paths have assertions. Edge case gap documented in test comments or evidence. |
| C | Happy path only. Error paths untested. | Tests only verify "it works" scenario. |
| D | No new tests added for the feature. | Test count unchanged from before feature work. |

**Checklist**:
- [ ] At least one test asserts the happy path (feature works as intended)
- [ ] At least one test asserts an error path (invalid input, missing data, boundary condition)
- [ ] At least one test asserts an edge case (empty input, max-size input, concurrent operations)
- [ ] Test assertions use the `assert()` helper from test.js, following existing block structure
- [ ] Test data is cleaned up after tests complete (no `__test_*` files left behind)

---

### 5. Code Clarity

Is the implementation readable, well-structured, and maintainable?

| Grade | Criteria | Evidence Required |
|-------|----------|-------------------|
| A | Clear naming, consistent structure, no dead code. Functions are small and single-purpose. Comments explain "why," not "what." ESLint 0/0. | `npm run lint` passes. Code review confirms naming and structure are consistent with existing codebase patterns. |
| B | Mostly clear. One or two long functions. Some comments missing on non-obvious logic. ESLint 0/0. | `npm run lint` passes. Long functions (>50 lines) documented with purpose comment. |
| C | Several readability issues: confusing names, dead code, missing comments on tricky logic. ESLint may have warnings. | `npm run lint` has warnings. Or manual review finds naming/structure issues. |
| D | Significant readability problems. Dead code, misleading names, no comments. ESLint has errors. | `npm run lint` has errors. |

**Checklist**:
- [ ] `npm run lint` passes (0 errors, 0 warnings)
- [ ] New functions have a JSDoc-style comment describing purpose, params, and return value
- [ ] No commented-out code blocks
- [ ] Variable names describe what they hold, not their type (e.g., `documents` not `arr`)
- [ ] New services follow existing class patterns (constructor injection, public API first, private helpers after)

---

## Composite Scoring

After scoring each dimension, compute the composite:

| Composite | Rule |
|-----------|------|
| A | At least 4 dimensions at A, none below B |
| B | No dimension below C |
| C | No dimension below D, at most 2 at C |
| D | Any dimension at D |

---

## Per-Feature Scorecard

Use this template for each completed feature. Copy into the feature'\''s evidence entry in `feature_list.json` or into a `contracts/kb-XXX-evaluation.md` file.

```
### kb-XXX: Feature Title — Evaluator Scorecard

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Code Correctness | | |
| Architecture Compliance | | |
| Error Handling | | |
| Test Thoroughness | | |
| Code Clarity | | |
| **Composite** | | |

**Evaluator**: [agent or human]
**Date**: YYYY-MM-DD
**Evidence**: npm test result, lint result, check-arch result, manual review notes
```

---

## How to Apply

1. **After feature completion**: Run `npm run verify` (lint + check-arch + test). Record results.
2. **Score each dimension**: Apply the criteria tables above. For each dimension, check every item in the checklist. If all pass, score A. If one fails, score B. If several fail, score C. If foundational items fail, score D.
3. **Record evidence**: Note specific file:line references for any B/C/D scores.
4. **Compute composite**: Apply the composite rule table.
5. **File the scorecard**: Add to `feature_list.json` evidence array, or create `contracts/kb-XXX-evaluation.md`.
6. **Act on gaps**: Any dimension at C or D should block the feature from being marked "passing." Any dimension at B should produce a documented follow-up task.

---

## Relationship to Other Harness Artifacts

| Artifact | Relationship |
|----------|-------------|
| `quality-document.md` | High-level domain/layer grades. This rubric provides the scoring method to produce those grades. |
| `feature_list.json` | Feature status. Use this rubric to produce structured evidence entries. |
| `contracts/kb-XXX-contract.md` | Sprint contract. The contract defines scope; this rubric evaluates delivery against that scope. |
| `npm run verify` | Baseline verification. Produces pass/fail signals used by dimensions 1, 2, and 5. |
| `exercises/Observability Gap Analysis.md` | Identified the missing rubric as Gap 9. This file closes that gap. |

---

## Example: kb-007 Evaluation (retrospective)

Scoring kb-007 (Grounded Q&A with citations) against this rubric, using evidence from the completed implementation:

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Code Correctness | B | All 26 new assertions pass. Happy path: ask() returns citations + confidence. Error path: no-indexed-docs returns low confidence. Gap: no test for corrupt qa-history.json recovery. |
| Architecture Compliance | A | QaService follows service pattern. IPC channels qa:ask and qa:get-history follow namespace:action. No boundary violations. check-arch clean. |
| Error Handling | C | _loadHistory() and _loadAllChunks() use silent catch blocks with no error logging or categorization. See Observability Gap Analysis Gap 1. |
| Test Thoroughness | B | Happy path + confidence thresholds tested. History persistence tested. Gap: no test for corrupt history file, no test for empty chunks directory. |
| Code Clarity | A | Well-structured class. Public API first, private helpers after. JSDoc comments on all public methods. ESLint 0/0. |
| **Composite** | **B** | Error handling at C drags composite down. Correctness B and thoroughness B are acceptable. |

This evaluation confirms: kb-007 is functionally correct and architecturally clean, but the error-handling gaps documented in the Observability Gap Analysis apply here. Fixing silent catches (Gap 1) would bring this feature to composite A.
