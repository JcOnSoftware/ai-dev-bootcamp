# Design: add-prompt-caching-track

**Change:** `add-prompt-caching-track`
**Phase:** design
**Date:** 2026-04-14
**Artifact store:** hybrid (engram + openspec)

---

## Architecture overview

No new runtime modules. Two surfaces change:

1. **Content** (new): `code/packages/exercises/02-caching/` — 5 exercises + 1 shared fixture.
2. **Infra extension point** (one file pair): `code/packages/cli/src/cost.ts` + `cost.test.ts` — extend `Usage` and `estimateCost()` to account for cache tokens.

The harness (`packages/runner`) is untouched: the Anthropic SDK already populates `message.usage.cache_creation_input_tokens`, `cache_read_input_tokens`, and `cache_creation.ephemeral_{5m,1h}_input_tokens` on the `Message` returned from `messages.create`, and the harness captures the whole object as-is (`CapturedCall.response: Message`).

Data flow (exercise runtime):

```
  starter.ts / solution.ts
          |
          | (SDK call with cache_control)
          v
  Anthropic.messages.create  ────►  proto.create patched by runner
          |                                  |
          v                                  v
  APIPromise<Message>              calls.push({ request, response })
          |                                  |
          | (resolves)                       |
          v                                  v
  response.usage (cache_* fields) ◄── tests.test.ts asserts
```

Cost flow:

```
  response.usage  ──►  estimateCost(model, usage)  ──►  "~$0.0012"
                          │
                          ├── regular input  = (input − cacheCreate − cacheRead) × in$
                          ├── cache read     = cache_read               × in$ × 0.1
                          ├── cache create 5m= ephemeral_5m             × in$ × 1.25
                          ├── cache create 1h= ephemeral_1h             × in$ × 2.0
                          └── output        = output_tokens             × out$
```

---

## ADRs

### ADR-1: Use Haiku 4.5 despite the 4,096-token min threshold
- **Status**: accepted
- **Context**: Caching only activates when the cacheable prefix crosses a model-specific minimum. Haiku 4.5 = 4,096; Sonnet 4.5 = 1,024. Sonnet makes it easier to trigger caching with a small fixture.
- **Decision**: Stick with Haiku 4.5 for all 5 exercises and build a ~4,200–4,500 token fixture to clear the threshold with margin.
- **Consequences**: (+) Keeps bootcamp-wide cost discipline — the entire track lands ~$0.026, consistent with Foundations' Haiku-first policy. (+) Learners see the realistic constraint of "caching requires a big prefix" rather than a toy 1,024-token one. (−) Fixture must be meaningful and ~17,000 chars; drift in the tokenizer could push us below the threshold.

### ADR-2: Shared fixture file as a new track-level convention
- **Status**: accepted
- **Context**: All 5 exercises need the same long system prompt. Inlining ~17k chars into every `starter.ts` is bloat and drift-prone.
- **Decision**: Create `code/packages/exercises/02-caching/fixtures/long-system-prompt.ts` exporting `LONG_SYSTEM_PROMPT` as a named `const`. Exercises import via relative path.
- **Consequences**: (+) DRY, one source of truth for token count. (+) Sets precedent for future tracks (RAG will want shared doc corpora). (−) Adds a "per-track `fixtures/` dir" concept to the mental model, though the exercise contract itself doesn't change. Documented in the track's first `exercise.md`.

### ADR-3: Extend `cost.ts` before authoring exercises
- **Status**: accepted
- **Context**: Exercise `02-cache-hit-metrics` asserts on cost savings calculated via `estimateCost()`. If we author exercises first, they'd fail against the old `estimateCost` that ignores `cache_*`.
- **Decision**: Phase 1 of apply = extend `cost.ts` + `cost.test.ts` (TDD). Phases 2+ = fixture + exercises.
- **Consequences**: (+) Separates infra risk from content risk — a bad cost regression is caught by existing CLI tests before any exercise breaks. (+) `aidev run` across the whole bootcamp immediately reports correct costs for any cached call. (−) A slightly larger first commit in the change's history.

### ADR-4: Backward-compatible `Usage` interface (all cache fields optional)
- **Status**: accepted
- **Context**: Existing exercises (Foundations) don't set `cache_control` and their captured `usage` objects don't include cache fields. Call sites across the CLI (`render.ts`, `run.ts`) already destructure `Usage`.
- **Decision**: Add `cache_creation_input_tokens?`, `cache_read_input_tokens?`, and `cache_creation?: { ephemeral_5m_input_tokens?, ephemeral_1h_input_tokens? }` as optional properties. No required fields change.
- **Consequences**: (+) Zero migration for Foundations exercises and existing CLI code paths. (+) `estimateCost()` handles `undefined` via `?? 0` fall-through — pricing for non-cached calls is byte-identical to today. (−) Slightly looser typing; mitigated by tests that cover both presence and absence.

### ADR-5: No harness changes
- **Status**: accepted
- **Context**: The SDK's `Message.usage` already surfaces every cache token field we need. The harness's `CapturedCall.response` is typed as the SDK's `Message`.
- **Decision**: Do not touch `packages/runner`. Tests assert directly on `call.response.usage.cache_*`.
- **Consequences**: (+) Less surface to break; no risk of regressing Foundations exercises. (+) Harness stays provider-agnostic in spirit. (−) Tests depend on the SDK's current field names — a major SDK rename would break. Mitigated by ADR-8 risk register.

### ADR-6: Fixture content = REST API design best practices
- **Status**: accepted
- **Context**: The fixture is injected in every cached-call exercise. It's read by the learner and the LLM. Lorem ipsum would feel like filler and the LLM's answers would be nonsensical when it's asked something.
- **Decision**: The fixture is a ~4,300-token technical document about REST API design best practices (versioning, pagination, error shapes, idempotency, HTTP semantics, resource modeling). Every exercise poses user turns that reference it, so the LLM's cached-vs-uncached responses are semantically comparable.
- **Consequences**: (+) Learner reads something useful while debugging. (+) Natural vehicle for tool-use exercise #05 ("given these API guidelines, propose an endpoint"). (−) Must be maintained to stay technically accurate; token count is brittle to edits.

### ADR-7: Default `ttl` remains unset in starter.ts
- **Status**: accepted
- **Context**: `cache_control` accepts `{ type: "ephemeral" }` (5-min default) or `{ type: "ephemeral", ttl: "1h" }`. Starting with `ttl: "5m"` explicit would defeat the point of exercise `04-ttl-extended`.
- **Decision**: Exercises 01–03 and 05 omit `ttl` entirely. Exercise 04's starter shows the 5m baseline and asks the learner to change to `"1h"` + reason about break-even.
- **Consequences**: (+) `04-ttl-extended` is a meaningful delta — learners experience the default before contrasting. (+) Matches the SDK default, so starters feel idiomatic. (−) Must document in `exercise.md` that "no ttl" == 5m (mitigated by `// Docs:` header link to the caching doc).

---

## Module API: `cost.ts` extension

**Important deviation from the orchestrator brief**: the current `estimateCost` signature is `(model: string, usage: Usage): string | null`, returning a formatted string like `~$0.0012`. We preserve the current signature to avoid breaking `render.ts` / `run.ts` / existing tests (Foundations exercises). Internal logic is what changes.

```ts
// Added types
export interface CacheCreation {
  ephemeral_5m_input_tokens?: number;
  ephemeral_1h_input_tokens?: number;
}

// Extended (backward-compatible — all new fields optional)
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation?: CacheCreation;
}

// Signature UNCHANGED
export function estimateCost(model: string, usage: Usage): string | null;
```

Pricing multipliers (module-local constants, not per-family):

```ts
const CACHE_READ_MULTIPLIER = 0.1;
const CACHE_WRITE_5M_MULTIPLIER = 1.25;
const CACHE_WRITE_1H_MULTIPLIER = 2.0;
```

Internal formula (per Anthropic docs: `input_tokens` is the *non-cache* portion; cache tokens are reported separately in their own fields and must be **added**, not subtracted):

```
regularInputTokens = usage.input_tokens          // already excludes cache tokens
cacheReadTokens    = usage.cache_read_input_tokens ?? 0
write5m            = usage.cache_creation?.ephemeral_5m_input_tokens
                     ?? usage.cache_creation_input_tokens   // fallback if breakdown absent
                     ?? 0
write1h            = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0

regularCost   = regularInputTokens / 1e6 * hit.input
readCost      = cacheReadTokens    / 1e6 * hit.input * 0.1
write5mCost   = write5m            / 1e6 * hit.input * 1.25
write1hCost   = write1h            / 1e6 * hit.input * 2.0
outputCost    = usage.output_tokens / 1e6 * hit.output

total = regular + read + write5m + write1h + output
return `~$${total.toFixed(4)}`
```

**Fallback rule**: if `usage.cache_creation` is absent but `usage.cache_creation_input_tokens > 0`, attribute the latter to 5m (the default TTL). Prevents double-counting when only one of the two shapes is present.

**Note on Anthropic semantics**: older Anthropic docs described `input_tokens` as inclusive of cache tokens; current docs (2025) report `input_tokens` as the non-cache portion, with `cache_creation_input_tokens` and `cache_read_input_tokens` as separate additive fields. The design above follows the current convention. `cost.test.ts` locks this via a fixture test.

---

## Module API: fixture

```ts
// code/packages/exercises/02-caching/fixtures/long-system-prompt.ts

/**
 * System prompt fixture for the 02-caching track.
 *
 * Contains REST API design guidance (~4,300 tokens). Large enough to exceed
 * Claude Haiku 4.5's 4,096-token cache threshold with ~200-400 tokens of margin.
 *
 * Docs: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
 */
export const LONG_SYSTEM_PROMPT: string = `You are a senior API architect...`;
```

- **Exports**: single named `LONG_SYSTEM_PROMPT`.
- **No side effects**, no imports.
- **Target**: ~17,000 chars → ~4,200–4,500 tokens (verified via Anthropic's tokenizer in a test helper).

---

## Module API: per-exercise helpers

Learners export these alongside `default run()`. The test files import the helper and call it on the captured usage.

- **Exercise `02-cache-hit-metrics`**:
  ```ts
  export interface CacheStats {
    cached: number;           // cache_read_input_tokens
    created: number;          // cache_creation_input_tokens (all TTLs summed)
    regular: number;          // input_tokens (non-cache)
    savings_pct: number;      // percent saved vs "same call, no cache"
    effective_cost_usd: number; // parsed from estimateCost(...)
  }
  export function cacheStats(usage: Usage, model: string): CacheStats;
  ```

- **Exercise `04-ttl-extended`**:
  ```ts
  /**
   * Returns the minimum number of cache-read calls after which 1h TTL
   * (2.0x write cost) amortizes below 5m TTL (1.25x write cost × N re-creates).
   */
  export function breakEvenCalls(cacheTokens: number, inputPricePerMillion: number): number;
  ```

Both helpers are pure. Both have unit tests that don't require the API.

---

## File layout

```
code/packages/exercises/02-caching/
├── fixtures/
│   └── long-system-prompt.ts
├── 01-basic-caching/
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   ├── meta.json
│   ├── es/
│   │   └── exercise.md
│   └── en/
│       └── exercise.md
├── 02-cache-hit-metrics/
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   ├── meta.json
│   ├── es/exercise.md
│   └── en/exercise.md
├── 03-multi-breakpoint/
│   └── (same 6 files)
├── 04-ttl-extended/
│   └── (same 6 files)
└── 05-caching-with-tools/
    └── (same 6 files)
```

Modified (NOT moved/renamed):
- `code/packages/cli/src/cost.ts` — extend `Usage`, extend `estimateCost` body.
- `code/packages/cli/src/cost.test.ts` — add cases for cache read, cache write 5m, cache write 1h, mixed, fallback (no `cache_creation` breakdown).

---

## Data flow diagrams

### 1. Cache write → read cycle (within one exercise `run()`)

```
  run()
   │
   ├── call #1: messages.create({ system: [{text, cache_control:ephemeral}], ... })
   │        │
   │        ├── SDK → Anthropic API
   │        │         (prefix > 4,096 tok → cache WRITE)
   │        ◄── Message.usage = {
   │               input_tokens: 12,          // user turn only
   │               output_tokens: 87,
   │               cache_creation_input_tokens: 4350,
   │               cache_read_input_tokens: 0
   │            }
   │
   ├── call #2 (back-to-back): same system prompt, different user turn
   │        │
   │        ├── SDK → Anthropic API
   │        │         (cache HIT — hashed prefix match, < 5 min old)
   │        ◄── Message.usage = {
   │               input_tokens: 15,
   │               output_tokens: 92,
   │               cache_creation_input_tokens: 0,
   │               cache_read_input_tokens: 4350
   │            }
   │
   └── tests assert: calls[0].response.usage.cache_creation_input_tokens > 0
                     calls[1].response.usage.cache_read_input_tokens > 0
```

### 2. Cost calculation breakdown

```
  Usage {
    input_tokens: 15,
    output_tokens: 92,
    cache_read_input_tokens: 4350
  }
       │
       ▼
  estimateCost("claude-haiku-4-5", usage)
       │
       ├── family = haiku  → in$=1.0, out$=5.0 per 1M
       ├── regularCost = 15    / 1e6 × 1.0         = 0.0000150
       ├── readCost    = 4350  / 1e6 × 1.0 × 0.1   = 0.0004350
       ├── write5m     = 0
       ├── write1h     = 0
       └── outputCost  = 92    / 1e6 × 5.0         = 0.0004600
       ▼
  total = 0.0009100  →  "~$0.0009"
```

---

## Testing strategy

**Unit (no API)**:
- `cost.test.ts` — new cases: cache read only, cache write 5m only, cache write 1h only, mixed all four, fallback when `cache_creation` breakdown absent, zero-everything edge case, backward-compat (no cache fields present).
- Helper tests colocated with exercises where appropriate: `cacheStats` and `breakEvenCalls` exercised via the exercise's own `tests.test.ts` with synthetic `Usage` inputs.

**Integration (real API, guarded)**:
- Each of the 5 exercises' `tests.test.ts` guards `ANTHROPIC_API_KEY` in `beforeAll` (consistent with Foundations).
- `run()` makes **two back-to-back calls** to the SDK within a single invocation → harness captures both via `result.calls`.
- Assertions are structural: `model === "claude-haiku-4-5-20251001"`, `request.system[0].cache_control.type === "ephemeral"`, `calls[0].response.usage.cache_creation_input_tokens > 0`, `calls[1].response.usage.cache_read_input_tokens > 0`, etc.
- Exercise `05-caching-with-tools` is a **3-turn loop** with tools; harness captures all 3 calls in `result.calls`.

**Time-sensitivity mitigation**: ephemeral 5m TTL is enforced by Anthropic per the hashed prefix, not per tests-run. Back-to-back calls within a single `run()` are <10s apart in practice. No cross-process or cross-test cache dependency.

---

## Risk register (design-level)

- **Fixture token-count drift** — a minor tokenizer adjustment or edit could push below 4,096 → cache silently disabled → `01-basic-caching` tests fail.
  - Mitigation: target 4,200–4,500 tokens (5–10% margin); include a unit test that hashes the fixture and asserts `length > 16500 chars`; weekly health-check can be extended to tokenize against API and assert `> 4096`.
- **`@anthropic-ai/sdk ^0.40` major bump renames cache fields** — e.g. `cache_creation_input_tokens` → `cacheCreationInputTokens`.
  - Mitigation: pin to `^0.40` (minor); add a smoke test in `cost.test.ts` that imports the SDK's `Message` type and structurally asserts the field names at compile time.
- **Haiku 4.5 deprecation / model-id rename** — `claude-haiku-4-5-20251001` sunset.
  - Mitigation: `valid_until` in each `meta.json` (existing contract); weekly health-check CI already pings model endpoints; fallback model documented in `CLAUDE.md`.
- **Anthropic pricing change** — 1.25× / 2.0× / 0.1× multipliers are API-wide today but could become per-model.
  - Mitigation: centralize multipliers as module-local constants in `cost.ts`; `cost.test.ts` pins expected outputs to 4 decimal places so drift is immediately caught.
- **`input_tokens` semantics ambiguity** — older docs said `input_tokens` includes cache tokens; current docs say it doesn't. If Anthropic reverts, our formula double-counts.
  - Mitigation: lock current semantics via a `cost.test.ts` fixture that mirrors a real API response (snapshot a Haiku 4.5 cached response once during apply).

---

## Implementation order

1. **`cost.ts` + `cost.test.ts`** — TDD: write failing cases first (cache read, 5m write, 1h write, mixed, fallback), then extend `Usage` and `estimateCost` body. Run `bun test` from `code/`.
2. **`fixtures/long-system-prompt.ts`** — write the REST-API-best-practices document; add a trivial colocated test asserting `LONG_SYSTEM_PROMPT.length > 16500`.
3. **Exercises, in order** — 01 → 02 → 03 → 04 → 05. Per-exercise TDD cycle:
   a. `tests.test.ts` (failing) — structural assertions against captured calls.
   b. `starter.ts` with `// Docs:` header + TODOs.
   c. `solution.ts` — passes tests.
   d. `es/exercise.md` (6 required sections) + `en/exercise.md` (mirror).
   e. `meta.json` with `id`, `track: "02-caching"`, `locales: ["es","en"]`, `valid_until`, `estimated_minutes`, `concepts`, `requires`.
4. **`bun test` + `bunx tsc --noEmit`** from `code/`.
5. **Manual smoke** — `aidev verify <id> --solution` for each of the 5 against the real API. Record final cost — expect total < $0.05.

---

## Open questions

None blocking. One item for the implementer to confirm empirically during apply:

- The **fallback semantics** for `cache_creation_input_tokens` vs the `cache_creation.ephemeral_5m/1h_input_tokens` breakdown: the SDK *may* always populate both fields in parallel for Haiku 4.5, in which case the fallback branch in `estimateCost` is dead code. Keep it anyway for defense in depth; a snapshot captured during exercise 01's first successful run will tell us which shape the API emits today. Do not over-engineer prematurely — if both are always present, document it in a code comment instead of deleting the fallback.

---

## skill_resolution: injected
