# Archive Report: add-agents-track

**Status**: `archived`  
**Archive Date**: 2026-04-15  
**Verification**: `passed-with-warnings → resolved → ready-to-archive`

## What Shipped

Track 05-agents (5 progressive exercises on agent loop anatomy: think→act→observe, state management, stop conditions, multi-step planning, self-correction). Built from commit `8b44a14` (fixture) → `1b168df` (exercise 05) + `027b259` (TS fix in 02) + `3e16076` (valid_until alignment). All 8 commits across fixture + 5 exercises + TS fix + valid_until sync.

## Stats

- **Total commits**: 8
- **Integration tests**: 37 (all passing)
- **Apply cost**: ~$0.02
- **Exercises**: 5 (01-simple-agent → 05-self-correction)

## Key Learnings

- **DIY loop beats Agent SDK for teaching**: SDK's Tool Runner beta hides loop internals. Learners need to see every iteration explicitly.
- **Cross-track fixture reuse works**: imported `DOCS_CHUNKS` from `04-rag/fixtures/`. New architectural convention — tracks can share fixtures via pinned field names (`.text` here).
- **Range assertions for iteration counts**: never exact counts. Haiku is non-deterministic on how many iterations a query needs.
- **`maxIterations: 10` as universal hard cap**: bounds worst-case cost + prevents infinite-loop bugs from burning budget.
- **Self-correction requires explicit prompting**: "If any tool returns `{ error }`, try a DIFFERENT approach." Model doesn't self-correct without this.
- **Multi-step planning requires explicit prompting**: "Break this into sub-questions. Search for each separately." One-shot behavior without it.
- **Haiku expresses math in varied forms**: "1.25x", "25% more", etc. Tests must accept ≥1 form.

## Warnings Resolved

- **W1** (valid_until drift): Resolved by commit `3e16076` (all exercises now declare `valid_until: "2026-06-30"`).
- **W2** (spot-check skipped): Informational; no action required.

## Ready to Archive

Change fully implemented, tested, and verified. Moving to archive.
