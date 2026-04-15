---
source: engram
archived_at: 2026-04-14
engram_topic: sdd/add-run-command/proposal
---

# Proposal: add-run-command

## Intent

Learners completing exercises (esp. `03-streaming` and future RAG/agents) pass tests but never SEE the real model output. Tests assert STRUCTURE (model, params, shape) — not content. As exercises grow in complexity, pedagogical value requires watching real responses. Add a playground command `aidev run <id>` that executes learner code against the real Anthropic API and prints readable results. Complements `verify` (which tests); does not replace it.

## Scope

### In Scope
- New CLI command: `aidev run <id>` — loads `starter.ts` (default) or `solution.ts` (`--solution`) via existing harness, executes, prints readable summary.
- Summary output: model used, input/output tokens, estimated cost, duration; full response text for non-streaming; delta count + accumulated text for streaming; labeled per-key output for structured returns (e.g. `{ deterministic, creative }`).
- Flag `--stream-live`: prints each streaming delta to stdout as it arrives.
- Flag `--full`: disables truncation of long outputs (default truncates at a reasonable cap).
- i18n keys under `run.*` namespace in `es.json` and `en.json` (es default).
- Brief note in `docs/EXERCISE-CONTRACT.md` that `aidev run` exists for playground use.

### Out of Scope
- Replacing `verify` or changing test behavior.
- Recording progress or touching `~/.aidev/progress.json`.
- Changing API key resolution (same as verify).
- New exercises or exercise content changes.
- Caching API responses.

## Capabilities

### New Capabilities
- `exercise-playground`: Run a learner's exercise code against the real Anthropic API and display model output, token usage, cost, and streaming deltas — without running tests or touching progress.

### Modified Capabilities
- `cli-commands`: Register new `run` subcommand alongside `init|list|verify|progress`.
- `exercise-contract`: Documentation note only (no contract change).
- `runner-harness`: Potentially adds optional stream-event observation hook for `--stream-live` (final choice deferred to design).

## Approach

Thin CLI command that reuses the existing `@aidev/runner` harness to execute the exercise module. The harness already captures `CapturedCall` (model, params, streamed flag, finalMessage, accumulated deltas) — the run command reads that capture + the exercise's own return value and formats both into human-readable output.

For `--stream-live`, two candidate strategies (design phase decides):
1. Extend harness with optional `onStreamEvent(event)` callback supplied per-invocation.
2. Run command performs its own lightweight tee-patch of `Messages.prototype.stream` iteration.

Cost is computed from captured token counts against a model price table (seeded with current public rates; noted as best-effort estimate).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `code/packages/cli/src/commands/run.ts` | New | Command implementation |
| `code/packages/cli/src/index.ts` | Modified | Wire `run` subcommand |
| `code/packages/cli/src/i18n/es.json` | Modified | Add `run.*` keys |
| `code/packages/cli/src/i18n/en.json` | Modified | Add `run.*` keys |
| `code/packages/runner/src/harness.ts` | Possibly Modified | Optional stream-event hook (design decides) |
| `docs/EXERCISE-CONTRACT.md` | Modified | One-paragraph note on playground use |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `--stream-live` regresses APIPromise preservation | Med | Design must pick strategy; apply must regression-test `stream()` + `create({stream:true})`; reuse existing harness tests. |
| Learner `starter.ts` returns odd shapes (null, Date, number) | Med | Fallback to `JSON.stringify` with safe replacer; never throw on unexpected return. |
| Real API cost per run surprises learner | Med | Print estimated cost on every run. |
| Huge responses flood terminal | Low | Truncate by default; `--full` to opt-in. |
| Missing `ANTHROPIC_API_KEY` | Low | Reuse verify's resolution + error i18n. |

## Rollback Plan

Fully additive: new command file, new i18n keys, optional harness hook. Rollback = `git revert` of the feature commit(s). No migrations, no user-state files touched.

## Success Criteria

- [ ] `aidev run 01-first-call` prints model, tokens, cost, duration, response text.
- [ ] `aidev run 02-params` labels `deterministic` and `creative` outputs separately.
- [ ] `aidev run 03-streaming` prints delta count + final text; `--stream-live` streams tokens live.
- [ ] `aidev run <id> --solution` executes solution.ts.
- [ ] No regression in `verify` or existing harness tests (`bun test` green from `code/`).
- [ ] `run` does not write to `~/.aidev/progress.json`.
- [ ] i18n keys exist in both `es.json` and `en.json`.
