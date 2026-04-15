# Archive Report: add-tool-use-track

**Change**: add-tool-use-track (Track 03 — Tool Use)  
**Status**: ARCHIVED  
**Verify Outcome**: PASSED  
**Archive Date**: 2026-04-15  
**Verification Cost**: ~$0.08 (31 integration test calls)  
**Apply Cost**: ~$0.03 (estimated)  
**Total Cost**: ~$0.11

## What Shipped

Implemented the complete **03-tool-use track** — 5 progressive exercises teaching Claude tool use end-to-end. Each exercise bilingual (es+en), using `claude-haiku-4-5-20251001`, with domain tools `get_weather` and `calculate`.

**Exercises** (commits 4b413ea–63460d9):
- **01-basic-tool**: Introduce tool definition and single invocation
- **02-tool-loop**: Implement agentic loop (tool → response → stop condition)
- **03-multiple-tools**: Expand tool set and invocation patterns
- **04-tool-choice**: Introduce `tool_choice` parameter (force/prevent tool use)
- **05-parallel-tools**: Emit and handle multiple tool_use blocks in parallel

**Test Coverage**: 31 new assertions (all PASS), structural-only per ADR-6 (one permitted regex assertion for numeric formatting).

## Suggested Follow-ups

1. **Docs URL normalization**: Convention drift between `docs.claude.com` and `platform.claude.com` across exercises + CLAUDE.md. Recommend standardizing on `docs.claude.com` (newer tracks use this). Update starter Docs: headers + lingering platform.claude.com refs.

2. **Document 04-tool-choice assertion pattern**: Exercise asserts on request `tool_choice` field rather than absence of tool_use blocks for the `none` case. Add explanatory sentence to exercise.md Extra Concept section (clarifies deliberate design choice).

3. **Document 05-parallel-tools prompt strategy**: Explain in exercise.md Extra Concept why the prompt must explicitly request parallel invocation ("call the tool twice…") for Haiku 4.5 to reliably emit multiple tool_use blocks (model behavior note).

## Stats

| Metric | Value |
|--------|-------|
| Exercises | 5 |
| Files created | 30 (6 per exercise: es/exercise.md, en/exercise.md, starter.ts, solution.ts, tests.test.ts, meta.json) |
| Test assertions | 31 |
| Commits | 5 (conventional format, no Co-Authored-By) |
| Locales | es, en |
| Model | claude-haiku-4-5-20251001 (cost discipline) |
| Domain | get_weather + calculate |
| Typecheck | PASS |
| Integration tests | PASS (31/31) |

