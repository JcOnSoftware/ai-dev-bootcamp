## Apply Progress — add-run-command (ALL BATCHES COMPLETE)

### Mode
Strict TDD — bun test from code/

---

## BATCH 1 — Phases 1–4: Logic layer

### Phase 1: i18n keys [DONE]
- [x] 1.1 [IMPL] Add run.* keys to es.json — 14 keys added
- [x] 1.2 [IMPL] Add run.* keys to en.json — 14 keys added (matching set)
- Commit: feat(i18n): add run.* keys to es.json and en.json (cee8959)

### Phase 2: Cost module [DONE]
- [x] 2.1 [TEST] Write failing tests for cost.ts (8 test cases — RED confirmed)
- [x] 2.2 [IMPL] Implement cost.ts with MODEL_PRICES + estimateCost()
- [x] 2.3 [VERIFY] All 8 tests pass; typecheck clean
- Commits: test(cost): (6e4a2e1) | feat(cost): (25b936a)

### Phase 3: Render module [DONE]
- [x] 3.1 [TEST] Write failing tests — truncate helpers
- [x] 3.2 [TEST] Write failing tests — shape detection (isMessage, renderReturn, renderSummary)
- [x] 3.3 [IMPL] Implement render.ts — truncate, isMessage, extractText, renderReturn, renderSummary
- [x] 3.4 [VERIFY] All 21 tests pass; typecheck clean
- Commits: test(render): (ee6e516) | feat(render): (9562ae6)
- **Deviation**: Used local structural type SdkMessage instead of importing Message from @anthropic-ai/sdk — CLI package doesn't have the SDK in its node_modules. Structurally identical at runtime; TypeScript satisfied. No design violation.

### Phase 4: Harness hook [DONE]
- [x] 4.1 [TEST] Write failing tests for harness onStreamEvent callback
- [x] 4.2 [IMPL] Extend harness with onStreamEvent option + teeStreamEvents helper
- [x] 4.3 [VERIFY] Full suite: 95 pass, 2 fail (same TODO starters as baseline)
- Commits: test(harness): (84c5040) | feat(harness): (bc648e4)
- **Regression**: 01-first-call 6/6, 02-params 8/8, 03-streaming 9/9 — all pass

---

## BATCH 2 — Phases 5–7: Command, docs, E2E

### Phase 5: Run command [DONE]
- [x] 5.1 [TEST] Write failing integration tests for run command (RED confirmed — "unknown command 'run'" error)
- [x] 5.2 [IMPL] Implement packages/cli/src/commands/run.ts
- [x] 5.3 [IMPL] Wire runCommand in packages/cli/src/index.ts
- [x] 5.4 [VERIFY] Unit-level: 3/3 pass; Integration: 5/5 pass
- Commit: feat(run): add run command with stream-live support and integration tests (9dc4d44)
- **Deviation**: MessageStreamEvent imported from @anthropic-ai/sdk not available in CLI package. Re-exported it from @aidev/runner's index.ts (single clean re-export).

### Phase 6: Docs [DONE]
- [x] 6.1 [DOCS] Added playground note to docs/EXERCISE-CONTRACT.md after "Review checklist"
- [x] 6.2 [DOCS] Updated CLAUDE.md CLI command list to include run command one-liner
- Commit: docs: add aidev run playground note to EXERCISE-CONTRACT and CLAUDE.md (5a54312)

### Phase 7: E2E verification [DONE]
- [x] 7.1 [VERIFY] bunx tsc --noEmit → exit 0 (zero errors)
- [x] 7.2 [VERIFY] bun test → 103 pass, 2 fail (same baseline TODO starters, no regressions)
- [x] 7.3 [VERIFY] All 6 manual smoke commands pass:

| Command | Result |
|---------|--------|
| aidev run 01-first-call --solution | ✅ exit 0, prints Model/Tokens/Cost/Duration + response text |
| aidev run 02-params --solution | ✅ exit 0, prints { deterministic, creative } labeled sections |
| aidev run 03-streaming --solution --stream-live | ✅ exit 0, deltas stream BEFORE Model: line |
| aidev run 01-first-call --solution --locale en | ✅ exit 0, EN labels (Model:, Tokens:, etc.) |
| aidev run xx-missing | ✅ exit 1, localized "not found" error to stderr |
| aidev run 01-first-call --solution (no progress) | ✅ progress.json not modified |

---

## Files Touched (all batches)

### Batch 1
- code/packages/cli/src/i18n/es.json — run.* keys added
- code/packages/cli/src/i18n/en.json — run.* keys added
- code/packages/cli/src/cost.ts — NEW: MODEL_PRICES + estimateCost()
- code/packages/cli/src/cost.test.ts — NEW: 8 unit tests
- code/packages/cli/src/render.ts — NEW: renderSummary, truncate, renderReturn, isMessage, extractText
- code/packages/cli/src/render.test.ts — NEW: 21 unit tests
- code/packages/runner/src/harness.ts — MODIFIED: onStreamEvent on RunOptions, teeStreamEvents helper
- code/packages/runner/src/harness.test.ts — NEW: 7 unit tests

### Batch 2
- code/packages/cli/src/commands/run.ts — NEW: run command implementation
- code/packages/cli/src/commands/run.test.ts — NEW: unit + integration tests
- code/packages/cli/src/index.ts — MODIFIED: added runCommand
- code/packages/runner/src/index.ts — MODIFIED: re-exports MessageStreamEvent
- docs/EXERCISE-CONTRACT.md — MODIFIED: playground note added
- CLAUDE.md — MODIFIED: run command added to CLI section

## Test Suite State (final)
- 103 pass, 2 fail (baseline starters expected — unchanged from pre-change)
- New tests total: 8 (cost) + 21 (render) + 7 (harness) + 8 (run command) = 44 new tests, all green
- Typecheck: clean

## TDD Cycle Evidence
| Task | Test File | RED | GREEN |
|------|-----------|-----|-------|
| 2.1+2.2 | cost.test.ts | ✅ Written | ✅ 8/8 pass |
| 3.1+3.2+3.3 | render.test.ts | ✅ Written | ✅ 21/21 pass |
| 4.1+4.2 | harness.test.ts | ✅ Written (2 failed) | ✅ 7/7 pass |
| 5.1+5.2 | run.test.ts | ✅ Written ("unknown command" error) | ✅ 8/8 pass |

## Status
20/20 tasks complete. Ready for verify.
