# Tasks: add-run-command

> **Strict TDD forwarding**: apply runs in Strict TDD Mode with test runner `bun test` from `code/`. Apply sub-agent must follow strict-tdd discipline.
>
> **Apply-progress continuity**: if multiple apply batches, each sub-agent MUST read `sdd/add-run-command/apply-progress` and MERGE (not overwrite) before saving.
>
> **APIPromise gotcha reminder**: `Messages.prototype.create` returns APIPromise. Never wrap in `async function`. Harness hook work MUST be regression-tested against 01-first-call, 02-params, 03-streaming before claiming done.

---

## Batch 1 — Phases 1–4: Logic layer (i18n, cost, render, harness hook)

### Phase 1: i18n keys

- [x] 1.1 [IMPL] Add `run.*` keys to `es.json` (14 keys)
- [x] 1.2 [IMPL] Add `run.*` keys to `en.json` (14 keys, matching set)

### Phase 2: Cost module

- [x] 2.1 [TEST] Write failing tests for `cost.ts` (RED)
- [x] 2.2 [IMPL] Implement `cost.ts` with MODEL_PRICES + estimateCost()
- [x] 2.3 [VERIFY] All 8 tests pass

### Phase 3: Render module

- [x] 3.1 [TEST] Write failing tests — truncate helpers (RED)
- [x] 3.2 [TEST] Write failing tests — shape detection (RED)
- [x] 3.3 [IMPL] Implement `render.ts`
- [x] 3.4 [VERIFY] All 21 tests pass

### Phase 4: Harness hook

- [x] 4.1 [TEST] Write failing tests for harness `onStreamEvent` callback (RED)
- [x] 4.2 [IMPL] Extend harness with `onStreamEvent` option
- [x] 4.3 [VERIFY] Full suite: 95 pass, 2 fail (same TODO starters as baseline)

---

## Batch 2 — Phases 5–7: Command, docs, E2E

### Phase 5: Run command

- [x] 5.1 [TEST] Write failing integration tests for `aidev run` (RED)
- [x] 5.2 [IMPL] Implement `packages/cli/src/commands/run.ts`
- [x] 5.3 [IMPL] Wire `runCommand` in `packages/cli/src/index.ts`
- [x] 5.4 [VERIFY] Unit-level: 3/3 pass; Integration: 5/5 pass

### Phase 6: Docs

- [x] 6.1 [DOCS] Add playground note to `EXERCISE-CONTRACT.md`
- [x] 6.2 [DOCS] Updated CLAUDE.md CLI command list

### Phase 7: End-to-end verification

- [x] 7.1 [VERIFY] Full type check — `bunx tsc --noEmit` → exit 0
- [x] 7.2 [VERIFY] Full test suite — `bun test` → 103 pass, 2 expected fail
- [x] 7.3 [VERIFY] Manual smoke — 6 commands (all pass)

---

## Summary

| Phase | Tasks | Type mix |
|-------|-------|----------|
| 1 — i18n | 2 | IMPL ×2 |
| 2 — Cost module | 3 | TEST, IMPL, VERIFY |
| 3 — Render module | 4 | TEST ×2, IMPL, VERIFY |
| 4 — Harness hook | 3 | TEST, IMPL, VERIFY |
| 5 — Run command | 4 | TEST, IMPL ×2, VERIFY |
| 6 — Docs | 2 | DOCS ×2 |
| 7 — E2E | 3 | VERIFY ×3 |
| **Total** | **21** | |
