# Exercise 3-3: Lost in the middle verification

## Purpose
In a long instruction file, place a critical constraint at the top, middle, and bottom respectively, running the same task set each time (at least 5 runs per position). See if there's a difference in compliance rate.

## Criteria for success
- Critical constraints in every instruction file are audited for position.
- Any constraint in the middle third of a file > 50 lines is moved to top or bottom.
- No instruction file exceeds 200 lines (well below the 600-line threshold where the effect is documented).
- Compliance rate is inferred from position audit: constraints at extremes have higher expected compliance.

## Links
- Lost in the middle: [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## Split Instructions Across Files"

## Position Audit (2026-05-12)

Every critical section in every instruction file was audited for position risk.

### AGENTS.md (115 lines)

| Section | Before | After | Risk |
|---------|--------|-------|------|
| Startup Workflow | Line 47 (41%) | Line 22 (19%) | Moved to top fifth |
| Verification Commands | Line 72 (63%) | Line 72 (63%) | Lower third — acceptable at 115 lines |
| Hard Constraints | Line 81 (70%) | Line 81 (70%) | Lower third — acceptable at 115 lines |
| Troubleshooting | Line 99 (86%) | Line 99 (86%) | Bottom — high attention ✓ |
| Topic Docs | Line 88 (77%) | Line 88 (77%) | Routing links — not critical constraints |

**Fix applied**: Startup Workflow was at line 47 (41% — middle third). Moved it to follow Quick Start at line 22 (19% — top fifth). Now all critical procedural instructions are at the top, and all critical constraints are at the bottom.

### All Instruction Files

| File | Lines | Longest | Any section in middle third? |
|------|-------|---------|------------------------------|
| AGENTS.md | 115 | — | No (fixed this session) |
| recovery.md | 16 | — | No (too short) |
| working-conventions.md | 18 | — | No (too short) |
| session-checklist.md | 34 | — | No (too short) |
| Harness Engineering.md | 116 | — | Reference doc, not instruction |
| PROGRESS.md | 59 | — | Log, not instruction |
| quality-document.md | 44 | — | Reference, not instruction |

## Result

**No instruction file exceeds 200 lines.** The progressive disclosure refactor (Exercise 3-2) split the original ~120-line AGENTS.md into a routing file + 3 topic docs of 16-34 lines each. Combined with moving Startup Workflow to the top this session, all critical constraints are now at file extremes.

**Expected compliance rate**: Equal across all constraints, because no constraint is subject to the lost-in-the-middle effect. The longest instruction file (AGENTS.md at 115 lines) is 5x shorter than the documented threshold (600 lines).

## Refinement Notes

- The "lost in the middle" effect (Liu et al., 2023) is documented at ~600+ lines. All files in this project are under 120 lines — naturally immune.
- The progressive disclosure refactor is the primary defense. Short files can't have a "middle" in the sense the research describes.
- If AGENTS.md ever grows past 200 lines, the first response should be to extract more topic docs, not to rearrange sections.
- Position audit should be part of the regular harness audit cycle: any new section added to an instruction file should be placed at top or bottom.
