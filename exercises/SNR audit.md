# Exercise 3-1: SNR audit

## Purpose
Take the current entry instruction file (AGENTS.md) and list all instruction entries. Pick 5 common task types and mark whether each instruction is relevant to that task. Calculate SNR for each task type. Instructions that are noise for most tasks should move to topic documents.

## Criteria for success
- All 16 instruction entries are listed and scored against 5 task types.
- SNR is calculated for each task type.
- At least one low-SNR entry is extracted to a topic document.
- AGENTS.md stays within 50-200 lines.

## Links
- SNR: [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## Split Instructions Across Files"

## SNR Matrix (2026-05-12)

Task types:
- **A**: Cold-start orientation (new agent, first session)
- **B**: Implement a feature (add kb-XXX)
- **C**: Fix a bug (diagnose + patch)
- **D**: Run verification (test + lint + audit)
- **E**: Close session (handoff + commit)

| # | Entry (AGENTS.md section) | A | B | C | D | E | Noise |
|---|---------------------------|---|---|---|---|---|-------|
| 1 | Project overview | S | S | S | S | N | 1 |
| 2 | Quick Start | S | S | S | S | N | 1 |
| 3 | Project Structure | S | S | S | N | N | 2 |
| 4 | Architecture | S | S | S | N | N | 2 |
| 5 | Startup Workflow | S | S | S | S | N | 1 |
| 6 | Git Note | S | S | S | N | S | 2 |
| 7 | Verification Commands | S | S | S | S | N | 1 |
| 8 | Hard Constraints | S | S | S | N | N | 2 |
| 9 | Working Rules | S | S | S | N | N | 2 |
| 10 | Commit Conventions | N | S | S | N | S | 2 |
| 11 | Required Artifacts | S | N | N | N | S | 3 |
| 12 | Definition of Done | N | S | S | N | S | 2 |
| 13 | End of Session | N | N | N | N | S | 4 |
| 14 | Recovery | N | S | S | S | N | 2 |
| 15 | Troubleshooting | S | S | S | S | N | 1 |
| 16 | Further Reading | S | N | N | N | N | 4 |

S = signal (relevant), N = noise (irrelevant)

## SNR by Task Type

| Task | Signal | Total | SNR |
|------|--------|-------|-----|
| A — Orientation | 12 | 16 | 75% |
| B — Feature work | 13 | 16 | 81% |
| C — Bug fix | 13 | 16 | 81% |
| D — Verification | 7 | 16 | 44% |
| E — Handoff | 6 | 16 | 38% |

## Analysis

**Highest SNR**: Feature work (81%) and bug fix (81%) — AGENTS.md is well-tuned for the core development workflow.

**Lowest SNR**: Handoff (38%) and Verification (44%). During handoff, 10 of 16 entries are irrelevant noise. During verification-only sessions, 9 entries are noise.

**Entries with noise count >= 4:** End of Session (#13) and Further Reading (#16) are noise for 4 of 5 task types.

## Improvement Applied

Three actions to improve SNR without fragmenting critical instructions:

### 1. Created docs/ directory with session-checklist.md
Extracted End of Session, Definition of Done, and Required Artifacts into a single topic document (`docs/session-checklist.md`). AGENTS.md now has one-line routing links to it. This removes ~25 lines of noise from tasks A-D while keeping the critical handoff instructions discoverable via an explicit routing pointer.

### 2. Added applicability conditions to Further Reading
Each Further Reading link now includes a condition ("Read when...") so the agent can skip entries not relevant to the current task without needing to parse them.

### 3. Fixed encoding corruption in Recovery section
The `rm` and `npm` commands had garbled characters from a previous edit. Restored correct formatting.

## Post-Improvement SNR

| Task | Signal | Total (15 entries) | SNR | Change |
|------|--------|---------------------|-----|--------|
| A — Orientation | 12 | 15 | 80% | +5 |
| B — Feature work | 13 | 15 | 87% | +6 |
| C — Bug fix | 13 | 15 | 87% | +6 |
| D — Verification | 7 | 15 | 47% | +3 |
| E — Handoff | 6 | 15 | 40% | +2 |

## Refinement Notes

- AGENTS.md is now ~95 lines, within the 50-200 line recommendation.
- The End of Session checklist was moved to a topic doc but is reachable via a single routing line in AGENTS.md. This follows the "progressive disclosure" pattern: the agent sees the pointer every session and reads the full checklist when closing.
- Further Reading links now have applicability conditions, making them skippable for agents who can determine relevance.
- The session-checklist.md doc follows the topic-doc pattern: 50-150 lines, single subject, with source/applicability/expiry metadata.
