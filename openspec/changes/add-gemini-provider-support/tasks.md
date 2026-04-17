# Tasks: add-gemini-provider-support

Strict TDD: ON. Each functional task = test first (RED) → implement (GREEN).

## Batch 0 — Spike + Dependencies (4 tasks)

- [ ] B0-T00: **Harness SPIKE** — write a throwaway script in `code/scripts/gemini-spike.ts` that instantiates `new GoogleGenAI({apiKey})`, grabs `Object.getPrototypeOf(ai.models)`, monkey-patches `generateContent` and `generateContentStream`, and confirms both interceptions work (non-streaming returns + streaming async-iterable). If spike fails or Live API is infeasible → document in spike notes, drop track 06 from scope.
- [ ] B0-T01: Add `"@google/genai": "^1.48.0"` to `code/packages/runner/package.json`. Run `bun install` from `code/`.
- [ ] B0-T02: Create `code/packages/exercises/gemini/.gitkeep` placeholder.
- [ ] B0-T03: Bump `version` to `"3.0.0"` in `code/package.json` and `code/packages/cli/package.json`.

## Batch 1 — Provider Types (1 task)

- [ ] B1-T01: Extend `code/packages/cli/src/provider/types.ts` — `SupportedProvider = "anthropic" | "openai" | "gemini"`, add `"gemini"` to `SUPPORTED_PROVIDERS` array. `bunx tsc --noEmit` stays clean.

## Batch 2 — Config (2 tasks)

- [ ] B2-T01: RED — Write tests for `resolveApiKey("gemini")` — reads `GEMINI_API_KEY` env, falls back to `config.geminiApiKey`, returns undefined if neither set.
- [ ] B2-T02: GREEN — Add `geminiApiKey?: string` to `Config` interface in `code/packages/cli/src/config.ts`. Add `"gemini"` branch to `resolveApiKey()`.

## Batch 3 — CLI Wiring (3 tasks)

- [ ] B3-T01: Add i18n strings to `code/packages/cli/src/i18n/en.json` and `es.json`:
  - `init.key_invalid_gemini`, `verify.no_gemini_key`, `progress.header_gemini`
  - Update `init.provider_prompt` to list Google (Gemini).
- [ ] B3-T02: Modify `code/packages/cli/src/commands/init.ts`:
  - Add `{ value: "gemini", label: "Google (Gemini)" }` to provider select options.
  - Add soft validation: warn (not exit) if key doesn't start with `AIza`.
  - Save key to `config.geminiApiKey`.
- [ ] B3-T03: Verify `aidev init` smoke-works: select Gemini, paste an `AIza...` key, confirm persisted to `~/.aidev/config.json`.

## Batch 4 — Commands, Cost, Render (4 tasks)

- [ ] B4-T01: Modify `code/packages/cli/src/commands/verify.ts` — add `gemini` branch: `envVarName = "GEMINI_API_KEY"`, passes `"gemini"` to `recordPass()`.
- [ ] B4-T02: Modify `code/packages/cli/src/commands/run.ts` — same gemini branch for env var.
- [ ] B4-T03: Modify `code/packages/cli/src/cost.ts` — add Gemini families (`gemini-2.5-flash-lite`, `gemini-2.5-flash$`, `gemini-2.5-pro`). Add `normalizeGeminiUsage(usageMetadata)` function. Verify cache multipliers (implicit vs explicit) — add `CACHE_MULTIPLIERS_GEMINI` if diverges from Anthropic.
- [ ] B4-T04: Modify `code/packages/cli/src/render.ts` — add `SdkGeminiResponse` interface, `isGeminiResponse()`, `extractTextFromGemini()`. Wire into `renderReturn()` and `renderSummary()`.

## Batch 5 — Harness Split (4 tasks)

- [ ] B5-T01: Extend `code/packages/runner/src/types.ts` — add `CapturedCallGemini`, `HarnessResultGemini`.
- [ ] B5-T02: RED — Write test for Gemini harness non-streaming capture (mock `Models.prototype.generateContent`).
- [ ] B5-T03: GREEN — Create `code/packages/runner/src/harness-gemini.ts` — `patchModels()` monkey-patches prototype methods, `runUserCodeGemini()` dynamic-imports + runs, restores prototype in `finally`. Use `Object.getPrototypeOf(new GoogleGenAI({apiKey:"x"}).models)` for prototype access.
- [ ] B5-T04: Modify `code/packages/runner/src/harness.ts` — add `case "gemini": return runUserCodeGemini(...)` branch.

## Batch 6 — 30 Exercises (6 mini-batches)

Each mini-batch = 5 exercises. Per exercise: `meta.json`, `starter.ts`, `solution.ts`, `tests.test.ts`, `en/exercise.md`, `es/exercise.md`.

- [ ] B6-T01: Track `01-foundations` (5 ex): `01-first-generate`, `02-model-selection`, `03-token-usage`, `04-streaming`, `05-structured-output`.
- [ ] B6-T02: Track `02-context-caching` (5 ex): `01-implicit-cache`, `02-explicit-cache-create`, `03-explicit-cache-reuse`, `04-cache-ttl`, `05-cache-cost-savings`.
- [ ] B6-T03: Track `03-function-calling` (5 ex): `01-first-tool`, `02-multiple-tools`, `03-parallel-tools`, `04-json-mode`, `05-tool-error-handling`.
- [ ] B6-T04: Track `04-rag` (5 ex): `01-first-embedding`, `02-cosine-similarity`, `03-retrieve-top-k`, `04-grounded-answer`, `05-rag-eval`.
- [ ] B6-T05: Track `05-agents` (5 ex): `01-agent-loop`, `02-multi-step-reasoning`, `03-planner-tools`, `04-memory`, `05-agent-eval`.
- [ ] B6-T06: Track `06-live-multimodal` (5 ex) — **gated on B0-T00 spike**: `01-live-connect`, `02-audio-to-text`, `03-audio-to-audio`, `04-interruption`, `05-live-cost`. If spike failed, SKIP this mini-batch and drop to 25 exercises.

## Batch 7 — CI + Docs + Verification (5 tasks)

- [ ] B7-T01: Update `.github/workflows/health-check.yml` — add Gemini step with `AIDEV_PROVIDER=gemini`, `GEMINI_API_KEY` secret.
- [ ] B7-T02: Update `README.md` + `README.es.md` — mention Gemini as third provider + 90 exercises total.
- [ ] B7-T03: Update `CLAUDE.md` — v3.0, 3 providers, Gemini track names.
- [ ] B7-T04: Run `bunx tsc --noEmit` from `code/` — must be clean.
- [ ] B7-T05: Smoke tests (manual):
  - `aidev init` → Gemini → valid key persists
  - `aidev list --provider gemini` → 30 (or 25) exercises, 6 (or 5) tracks
  - `aidev verify 01-first-generate --provider gemini --solution` → passes vs real API
  - `aidev progress` → shows 3 provider groups
  - `AIDEV_PROVIDER=anthropic bun test packages/exercises/anthropic` → green
  - `AIDEV_PROVIDER=openai bun test packages/exercises/openai` → green

## Done
- [ ] All batches checked off.
- [ ] `bunx tsc --noEmit` clean.
- [ ] All tests pass.
- [ ] PR opened + CI green + merged to main.
- [ ] Archive SDD (move to `openspec/changes/archive/2026-04-17-add-gemini-provider-support/` + save archive-report to engram).
- [ ] Tag `v3.0.0`.
