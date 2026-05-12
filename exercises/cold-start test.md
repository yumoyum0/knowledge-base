# Exercise: Cold-start test

## Purpose
Open a completely fresh agent session in your project (no verbal context, repo contents only). Ask it five questions: What is this system? How is it organized? How do I run it? How do I verify it? What's the current progress? Record what it can't answer, then improve the repo until it can.

## Criteria for success
- All five questions are answerable from repo files alone (no chat context).
- Answers are accurate, complete, and discoverable within 60 seconds of reading.
- No question requires reading more than 2 files to answer.
- A human browsing the repo also gets a clear entry point (README.md).

## Links
- Cold-start test: [data/Harness Engineering.md](../data/Harness%20Engineering.md) "## How to Draw a Good Map"

## Test Record (2026-05-12)

### Question 1: What is this system?
**Source**: AGENTS.md line 2
**Answer**: "Knowledge-Base: a minimal Electron desktop app for managing local markdown/text documents with Q&A search." Tech stack also listed.
**Time to answer**: < 5 seconds
**Verdict**: PASS

### Question 2: How is it organized?
**Source**: AGENTS.md Project Structure table + Architecture section
**Answer**: 8-file table mapping every file to its role. ASCII diagram showing main → preload → renderer process model. IPC channel naming documented.
**Time to answer**: < 10 seconds
**Verdict**: PASS

### Question 3: How do I run it?
**Source**: AGENTS.md Quick Start section
**Answer**: `./init.sh` (Linux/macOS) or `./init.ps1` (Windows). Both run install + test + lint.
**Time to answer**: < 5 seconds
**Verdict**: PASS

### Question 4: How do I verify it?
**Source**: AGENTS.md Verification Commands table + init scripts
**Answer**: `npm test` (75 assertions), `npm run lint` (ESLint 0/0), `node --version` (24.x), `npm install`. Both init scripts run all checks automatically.
**Time to answer**: < 10 seconds
**Verdict**: PASS

### Question 5: What's the current progress?
**Source**: PROGRESS.md (linked from AGENTS.md step 2) + session-handoff.md
**Answer**: All features passing (kb-001–004). Harness scores: I5 T4 E3 S5 F4. Next step points to new features.
**Time to answer**: < 15 seconds (requires reading second file)
**Verdict**: PASS

## Gaps Found

### Gap 1: No README.md for human visitors
A human browsing the repo (GitHub, filesystem) sees no entry point. AGENTS.md works for agents but humans look for README.md first.

### Gap 2: "What to work on next" not surfaced in AGENTS.md
When all features are passing, AGENTS.md Startup Workflow says "choose the highest-priority unfinished feature" but no features are unfinished. A fresh agent must discover quality-document.md's unimplemented domains on their own. The link from "next step" to the list of potential new features is implicit.

## Improvements Applied

### Fix 1: Created README.md
Minimal README pointing humans to AGENTS.md for agent-oriented docs and listing the quick start commands. Makes the repo browsable on GitHub.

### Fix 2: Added "No Active Features" guidance to AGENTS.md
Explicit clause in Startup Workflow: when all features are passing, consult quality-document.md for unimplemented domains and add new features to feature_list.json. Closes the discoverability gap.
