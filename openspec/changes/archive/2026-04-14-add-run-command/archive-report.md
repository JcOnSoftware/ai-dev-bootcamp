## Change + Outcome

**add-run-command** → ARCHIVED, status: PASSED (verified 2026-04-14)

Learners can now run individual exercises against the real Anthropic API via `aidev run <id>`, observing actual model outputs, token consumption, cost estimates, and streaming deltas in real time. The feature complements `verify` (tests + progress tracking) without replacing it. All 20 implementation tasks completed under Strict TDD discipline; 103+ tests passing; zero regressions in existing exercise suites.

## What Shipped

### Capability: exercise-playground
Learners execute starter.ts (default) or solution.ts via `aidev run <id> --solution`, receiving a readable summary with: exercise id, target, model name, input/output token counts, estimated cost, wall-clock duration, and full response text (truncated at 2000 chars by default, `--full` to disable).

For structured returns like `{ deterministic: Message, creative: Message }`, output renders one labeled section per top-level key. For streaming exercises, `--stream-live` prints each incoming `text_delta` to stdout in real time before the summary.

### Capability: harness stream-event observation
`@aidev/runner` harness gains optional `onStreamEvent?: (event: MessageStreamEvent) => void` hook on RunOptions. When provided, harness subscribes to MessageStream's existing `.on("streamEvent", ...)` EventEmitter API (not a second SDK patch layer), invoking callback for each event in arrival order.

### Files modified/created (16 total)

#### @aidev/cli package (8 files)
- `src/commands/run.ts` — NEW (73 LOC)
- `src/cost.ts` — NEW, MODEL_PRICES with haiku/sonnet/opus families, lastUpdated: "2026-04"
- `src/cost.test.ts` — NEW, 8 unit tests
- `src/render.ts` — NEW, renderSummary, truncate, isMessage/extractText, renderReturn
- `src/render.test.ts` — NEW, 21 unit tests
- `src/i18n/es.json` — MODIFIED, 14 run.* keys added
- `src/i18n/en.json` — MODIFIED, 14 run.* keys added
- `src/index.ts` — MODIFIED, program.addCommand(runCommand)

#### @aidev/runner package (2 files)
- `src/harness.ts` — MODIFIED, RunOptions gains onStreamEvent, teeStreamEvents helper
- `src/index.ts` — MODIFIED, re-exports MessageStreamEvent

#### Documentation (2 files)
- `docs/EXERCISE-CONTRACT.md` — MODIFIED, playground note under return values
- `CLAUDE.md` — MODIFIED, run command added to CLI section

#### Tests (4 files)
- `packages/runner/src/harness.test.ts` — NEW, 7 tests
- `packages/cli/src/commands/run.test.ts` — NEW, 8 tests

## Key Decisions (5 ADRs)

- **Q1 Harness streaming hook vs CLI tee-patch**: Option A — harness extends via MessageStream.on("streamEvent", …) callback.
- **Q2 Return-value shape detection**: 3-way heuristic — isMessage → text; plain object → per-key; fallback → JSON under label.
- **Q3 Cost when model_cost_hint absent**: Static family-keyed regex lookup table with lastUpdated visible.
- **Q4 Output truncation**: 2000-char hard cap; `--full` disables; suffix localized via t().
- **Q5 Cost precedence**: model_cost_hint > computed table > cost_unknown.

## Test Metrics

- New tests: 44 (8 cost + 21 render + 7 harness + 8 run command)
- Suite state: 103 pass, 2 expected fail (baseline TODO starters)
- TDD: 4 RED→GREEN cycles confirmed in git log

## Open Suggestions (non-blocking)

1. Dead i18n key: `run.error.hint` defined in both JSONs but never called.

## Next Recommended

| Priority | Item |
|----------|------|
| MUST | Finish Foundations track (04-tokens-cost, 05-error-handling) |
| SHOULD | Flip repo to PUBLIC on GitHub |
| COULD | Quarterly review of MODEL_PRICES table (lastUpdated: "2026-04") |

## Persistence Pointers (Engram Topic Keys)

All SDD artifacts retained in engram:
- `sdd/add-run-command/proposal` (#90)
- `sdd/add-run-command/spec/exercise-playground` (#91)
- `sdd/add-run-command/spec/cli-commands-delta` (#92)
- `sdd/add-run-command/spec/runner-harness-delta` (#93)
- `sdd/add-run-command/spec/exercise-contract-delta` (#94)
- `sdd/add-run-command/design` (#96)
- `sdd/add-run-command/tasks` (#97)
- `sdd/add-run-command/apply-progress` (#98)
- `sdd/add-run-command/verify-report` (#99)
- `sdd/add-run-command/archive-report` (#100)
