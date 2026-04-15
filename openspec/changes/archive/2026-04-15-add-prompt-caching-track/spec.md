# Spec: add-prompt-caching-track

**Change:** `add-prompt-caching-track`
**Phase:** spec
**Date:** 2026-04-14
**Artifact store:** hybrid (engram + openspec)

---

## Exercise-level requirements

### Exercise: `01-basic-caching`

- **Single concept:** Add `cache_control: { type: "ephemeral" }` to a system prompt block and make two back-to-back calls to observe cache creation then cache read.
- **Learner task:**
  - Import `LONG_SYSTEM_PROMPT` from the shared fixture.
  - Make two sequential `messages.create` calls in `run()`, both passing the fixture as a system message block with `cache_control: { type: "ephemeral" }`.
  - Return both call results (or an object with `call1` and `call2`) so tests can inspect both responses.
- **Required SDK surface:**
  - `Anthropic.messages.create` with `system` as an array of content blocks.
  - `cache_control: { type: "ephemeral" }` on a system block.
  - `response.usage.cache_creation_input_tokens` and `response.usage.cache_read_input_tokens`.
- **Assertions (testable scenarios):**
  - `result.calls` has length 2.
  - Call 1 request: `system` is an array; at least one block has `cache_control.type === "ephemeral"`.
  - Call 1 response: `usage.cache_creation_input_tokens > 0`.
  - Call 1 response: `usage.cache_read_input_tokens === 0` (first call always writes, never reads).
  - Call 2 request: `system` is an array; at least one block has `cache_control.type === "ephemeral"`.
  - Call 2 response: `usage.cache_read_input_tokens > 0`.
  - Both requests: `request.model` matches `/haiku/i`.
  - Both responses: contain at least one `text` content block.
- **Model + max_tokens:** `claude-haiku-4-5-20251001`, `max_tokens: 256`.
- **Expected behavior:** Running `aidev run 01-basic-caching` prints two usage objects — the first shows `cache_creation_input_tokens > 0`, the second shows `cache_read_input_tokens > 0`, confirming the system prompt is cached between calls.

---

### Exercise: `02-cache-hit-metrics`

- **Single concept:** Parse the `usage` object from a cache-hit response and compute savings percentage plus effective cost using cache-aware pricing.
- **Learner task:**
  - Implement helper `cacheStats(usage: CacheUsage): CacheStats` that returns `{ cached, created, regular, savings_pct, effective_cost_usd }`.
  - Export `cacheStats` by name (tests import it directly for unit testing).
  - In `run()`: make 2 calls (first warms cache, second hits it) and return `cacheStats` applied to the second call's `usage`.
- **Required SDK surface:**
  - `response.usage.cache_creation_input_tokens`, `cache_read_input_tokens`, `input_tokens`, `output_tokens`.
  - `estimateCost` from `cost.ts` (extended version — this exercise requires the `cost.ts` prereq task).
- **Assertions (testable scenarios):**
  - Unit test (no API): `cacheStats` called with mock usage `{ cache_read_input_tokens: 5000, cache_creation_input_tokens: 0, input_tokens: 50, output_tokens: 100 }` returns object with keys `cached`, `created`, `regular`, `savings_pct`, `effective_cost_usd`.
  - `stats.cached === 5000` for the mock above.
  - `stats.savings_pct` is a number between 0 and 100.
  - Integration test: `result.calls` has length 2.
  - Integration test: returned stats object has all 5 keys present.
  - `stats.savings_pct > 50` (cache read is 0.1× vs full input — savings will exceed 80% in practice).
  - `stats.effective_cost_usd` is a positive finite number.
  - `result.calls[1].request.model` matches `/haiku/i`.
- **Model + max_tokens:** `claude-haiku-4-5-20251001`, `max_tokens: 256`.
- **Expected behavior:** Running `aidev run 02-cache-hit-metrics` prints the `CacheStats` object showing over 80% savings on the second call, with the effective cost in USD calculated using the 0.1× read multiplier.

---

### Exercise: `03-multi-breakpoint`

- **Single concept:** Place `cache_control` on three distinct content locations — system block, last tool definition, and a prior-turn assistant message — to cache multiple prefixes in a single conversation.
- **Learner task:**
  - Define at least 2 tools; add `cache_control: { type: "ephemeral" }` to the last tool definition.
  - Use `LONG_SYSTEM_PROMPT` as a cached system block (breakpoint 1).
  - In the message history, include a prior assistant turn with `cache_control: { type: "ephemeral" }` on its last content block (breakpoint 3).
  - Make a warmup call (turn 1), then a second call that should hit all three caches.
  - Return both responses so tests can inspect them.
- **Required SDK surface:**
  - `cache_control` on a tool object's last position in the `tools` array.
  - `cache_control` on an assistant message content block (conversation history).
  - `cache_control` on a system block.
  - `response.usage.cache_read_input_tokens`.
- **Assertions (testable scenarios):**
  - Call 1 request: `system` array has at least one block with `cache_control.type === "ephemeral"`.
  - Call 2 request: `tools` array exists; the last tool has `cache_control.type === "ephemeral"` (or `input_schema.cache_control` — assert presence anywhere on the last tool object).
  - Call 2 request: total blocks with `cache_control` across `system`, `tools`, and `messages` is >= 3 and <= 4 (never exceeds the 4-breakpoint limit).
  - Call 2 response: `usage.cache_read_input_tokens > 0`.
  - Both requests: `request.model` matches `/haiku/i`.
  - Call 2 response: contains at least one content block.
- **Model + max_tokens:** `claude-haiku-4-5-20251001`, `max_tokens: 512`.
- **Expected behavior:** Running `aidev run 03-multi-breakpoint` shows the second call's usage with `cache_read_input_tokens > 0`, confirming multiple cache prefixes were read. A warning comment in `solution.ts` documents the 4-breakpoint hard limit.

---

### Exercise: `04-ttl-extended`

- **Single concept:** Use `cache_control: { type: "ephemeral", ttl: "1h" }` for long-lived caching, and implement `breakEvenCalls(cacheTokens, pricePerMillion)` to calculate the minimum reads needed to offset the 2× write premium over the 1.25× default.
- **Learner task:**
  - Implement and export by name `breakEvenCalls(cacheTokens: number, pricePerMillion: number): number` — returns the minimum integer reads for 1h write to be cheaper than repeated 5min writes.
  - In `run()`: make 2 calls using `cache_control: { type: "ephemeral", ttl: "1h" }` on the system block, return both responses.
- **Required SDK surface:**
  - `cache_control: { type: "ephemeral", ttl: "1h" }` on a system block.
  - `response.usage.cache_creation_input_tokens`.
- **Assertions (testable scenarios):**
  - Unit test (no API): `breakEvenCalls(4200, 1.0)` returns a positive integer.
  - Unit test: formula semantics — 1h write costs 2× per write cycle; 5m write costs 1.25×; `breakEvenCalls` result satisfies: `(result * 0.1 + 2.0) <= ((result + 1) * 1.25)` approximately (reflects amortizing 2× once vs 1.25× each time — acceptable to verify the integer is >= 1 and <= 20 for reasonable inputs).
  - Integration test: `result.calls` has length 2.
  - Call 1 request: `system` array has a block with `cache_control.ttl === "1h"` (or the `cache_control` object stringified contains `"1h"`).
  - Call 1 response: `usage.cache_creation_input_tokens > 0`.
  - Call 2 response: `usage.cache_read_input_tokens > 0`.
  - Both requests: `request.model` matches `/haiku/i`.
- **Model + max_tokens:** `claude-haiku-4-5-20251001`, `max_tokens: 256`.
- **Expected behavior:** Running `aidev run 04-ttl-extended` shows the extended TTL in usage output plus the break-even calculation printed to console, helping the learner reason about when 1h TTL is economically justified.

---

### Exercise: `05-caching-with-tools`

- **Single concept:** Combine prompt caching with tool use in a multi-turn conversation — cache the system prompt and tool definitions, then carry forward cached history across turns.
- **Learner task:**
  - Define at least 1 tool with `cache_control: { type: "ephemeral" }` on the last tool (breakpoint 2).
  - Use `LONG_SYSTEM_PROMPT` as a cached system block (breakpoint 1).
  - Turn 1: send a user message that triggers tool use; Claude responds with `tool_use` block.
  - Turn 2: send `tool_result` + next user message; second call should hit cached system + tools.
  - Return both responses so tests can inspect them.
- **Required SDK surface:**
  - `cache_control` on system block and last tool definition.
  - Multi-turn messages with `tool_use` and `tool_result` content blocks.
  - `response.usage.cache_read_input_tokens` on turn 2.
- **Assertions (testable scenarios):**
  - `result.calls` has length 2.
  - Call 1 request: `system` has at least one block with `cache_control.type === "ephemeral"`.
  - Call 1 request: `tools` array exists and has length >= 1.
  - Call 1 request: last tool has `cache_control` present (anywhere on the tool object).
  - Call 1 response: content contains at least one block with `type === "tool_use"`.
  - Call 2 request: `tools` array still present with `cache_control` on last tool.
  - Call 2 response: `usage.cache_read_input_tokens > 0`.
  - Call 2 response: contains at least one content block.
  - Both requests: `request.model` matches `/haiku/i`.
- **Model + max_tokens:** `claude-haiku-4-5-20251001`, `max_tokens: 512`.
- **Expected behavior:** Running `aidev run 05-caching-with-tools` executes a 2-turn tool-use conversation; the second call's usage shows cache reads, demonstrating that caching is compatible with and complementary to tool use.

---

## Fixture requirements

- **Path:** `code/packages/exercises/02-caching/fixtures/long-system-prompt.ts`
- **Export:** `export const LONG_SYSTEM_PROMPT: string` — named export, no default export.
- **Content:** Technical prose about REST API design best practices. Topics should include: resource naming conventions, HTTP verb semantics, versioning strategies, pagination patterns, error response shapes, authentication header conventions, rate limiting, idempotency keys, HATEOAS links, and OpenAPI contract-first design. Pedagogically useful: the learner can read it and learn something, not just filler `lorem ipsum`.
- **Length:** ~4,200–4,500 tokens (approximately 16,000–18,000 characters for English-heavy technical prose). Must exceed Haiku 4.5's 4,096-token minimum threshold to guarantee cache activation on all 5 exercises.
- **Format:** Plain string with markdown-style headings (`#`, `##`, `###`) and code snippet blocks (using backtick fences). No actual executable code — only documentation-style text.
- **Imported by:** All 5 `solution.ts` files and all 5 `starter.ts` files (where the learner would need it). The fixture is a peer import: `import { LONG_SYSTEM_PROMPT } from "../../fixtures/long-system-prompt.ts"`.
- **Not part of the exercise contract:** The fixture directory is not an exercise and has no `meta.json`, `tests.test.ts`, or `exercise.md`.

---

## Cost.ts extension requirements

This is a **prerequisite task** that must be completed before exercise `02-cache-hit-metrics` can be implemented.

### Interface extension

Extend `Usage` in `code/packages/cli/src/cost.ts` to add optional cache fields:

```ts
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation?: {
    ephemeral_5m_input_tokens?: number;
    ephemeral_1h_input_tokens?: number;
  };
}
```

- `cache_creation_input_tokens` — tokens written to cache (5min TTL, 1.25× multiplier).
- `cache_read_input_tokens` — tokens read from cache (0.1× multiplier).
- `cache_creation.ephemeral_5m_input_tokens` — explicit 5min write bucket (for future granular pricing; may be 0 initially).
- `cache_creation.ephemeral_1h_input_tokens` — explicit 1h write bucket (2× multiplier).

All fields are optional to preserve backward compatibility. Callers passing only `{ input_tokens, output_tokens }` continue to work without modification.

### `estimateCost` extension

Extend `estimateCost(model: string, usage: Usage): string | null` to apply cache multipliers:

- `cache_read_input_tokens`: multiply by `0.1 × hit.input` (90% discount vs regular input).
- `cache_creation_input_tokens` (when `cache_creation` is absent or `ephemeral_5m_input_tokens` is not set): multiply by `1.25 × hit.input`.
- `cache_creation.ephemeral_1h_input_tokens` (when present and > 0): multiply by `2.0 × hit.input`.
- `cache_creation.ephemeral_5m_input_tokens` (when present and > 0): multiply by `1.25 × hit.input`; in this case `cache_creation_input_tokens` is the fallback if neither granular field is set.
- Priority: if `cache_creation.ephemeral_5m_input_tokens` or `ephemeral_1h_input_tokens` are set, use them. If only `cache_creation_input_tokens` is set (no `cache_creation` object), treat as 5min write (1.25×).

Signature stays backward compatible: `estimateCost(model, usage)` — parameter order unchanged.

### New test cases in `cost.test.ts`

All added to the existing `describe("estimateCost", ...)` block or a new `describe("estimateCost — cache pricing", ...)`:

1. **Baseline unchanged:** `estimateCost("claude-haiku-4-5", { input_tokens: 1000, output_tokens: 500 })` returns same value as before (no regressions).
2. **5min write multiplier:** Usage with `{ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000 }` → cost equals `1.25 × haiku.input × 1.0` = `~$1.2500`.
3. **1h write multiplier:** Usage with `{ input_tokens: 0, output_tokens: 0, cache_creation: { ephemeral_1h_input_tokens: 1_000_000 } }` → cost equals `2.0 × haiku.input × 1.0` = `~$2.0000`.
4. **Cache read multiplier:** Usage with `{ input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000 }` → cost equals `0.1 × haiku.input × 1.0` = `~$0.1000`.
5. **Mixed arithmetic:** Usage with `{ input_tokens: 500, output_tokens: 200, cache_creation_input_tokens: 1000, cache_read_input_tokens: 4000 }` → cost is positive, greater than zero, and less than equivalent full-input cost of `5700 input_tokens` (reads are cheaper).
6. **Zero cache fields:** Usage with all cache fields set to 0 → same as `{ input_tokens: X, output_tokens: Y }` (no change from non-cache behavior).

---

## Track structure requirements

```
code/packages/exercises/02-caching/
├── fixtures/
│   └── long-system-prompt.ts           ← shared fixture (no meta.json)
├── 01-basic-caching/
│   ├── es/exercise.md
│   ├── en/exercise.md
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   └── meta.json
├── 02-cache-hit-metrics/
│   ├── es/exercise.md
│   ├── en/exercise.md
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   └── meta.json
├── 03-multi-breakpoint/
│   ├── es/exercise.md
│   ├── en/exercise.md
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   └── meta.json
├── 04-ttl-extended/
│   ├── es/exercise.md
│   ├── en/exercise.md
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   └── meta.json
└── 05-caching-with-tools/
    ├── es/exercise.md
    ├── en/exercise.md
    ├── starter.ts
    ├── solution.ts
    ├── tests.test.ts
    └── meta.json
```

### `meta.json` per exercise

| Field | Value |
|---|---|
| `id` | matches directory name exactly |
| `track` | `"02-caching"` |
| `title` | human-readable title (matches H1 in `es/exercise.md`) |
| `version` | `"1.0.0"` |
| `valid_until` | `"2026-10-15"` |
| `concepts` | relevant tags (e.g. `["prompt-caching", "cache_control", "usage"]`) |
| `estimated_minutes` | exercise-specific (20, 20, 25, 20, 35 respectively) |
| `requires` | dependency chain: 02→01, 03→02, 04→03, 05→04; exercise 01 requires `["01-first-call"]` |
| `locales` | `["es", "en"]` |
| `model_cost_hint` | e.g. `"~$0.003 per verify run (Haiku 4.5)"` |

No new CLI changes needed — `aidev list` already groups by `track` field dynamically.

---

## Starter contract requirements

Each `starter.ts` MUST:

1. **Docs comment header** — first non-empty content block in the file:
   ```ts
   // Docs:
   //   Prompt caching guide : https://docs.claude.com/en/docs/build-with-claude/prompt-caching
   //   cache_control API ref : https://docs.anthropic.com/en/api/messages
   //   Model IDs             : https://docs.anthropic.com/en/docs/about-claude/models
   ```
   Exercise 03 and 05 should also add a tools reference. Exercise 04 should also add the TTL note.

2. **Default export:** `export default async function run()` — return type matches what the tests import (typically `{ call1: Message, call2: Message }` or the stats object for exercise 02).

3. **Named helper exports** for exercises that require them:
   - Exercise 02: `export function cacheStats(usage: CacheUsage): CacheStats` — must throw `new Error("TODO: implement cacheStats — see es/exercise.md")`.
   - Exercise 04: `export function breakEvenCalls(cacheTokens: number, pricePerMillion: number): number` — must throw `new Error("TODO: implement breakEvenCalls — see es/exercise.md")`.

4. **TODO body:**
   ```ts
   export default async function run() {
     throw new Error("TODO: implement — see es/exercise.md (or en/exercise.md)");
   }
   ```

5. **Fixture import** (exercises 01–05): `import { LONG_SYSTEM_PROMPT } from "../../fixtures/long-system-prompt.ts"` — present but commented out or active. If active, the fixture import alone must not cause the starter to pass tests.

6. **Locale-neutral:** no translated strings; Spanish/English lives only in `<locale>/exercise.md`.

---

## Test assertion style

- **Structural only** — never assert on literal LLM-generated text content.
- **Harness pattern** — every `tests.test.ts` follows the established pattern:
  ```ts
  import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";
  const EXERCISE_FILE = resolveExerciseFile(import.meta.url);
  ```
- **API key guard:**
  ```ts
  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — this exercise hits the real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  });
  ```
- **Unit tests for helpers** (exercises 02 and 04): pure functions tested without `runUserCode` — import the helper by name from the exercise file resolved via `resolveExerciseFile`. No API call needed. Use `AIDEV_TARGET=starter` to verify the stub throws.
- **Cache field access:** assert on `result.calls[N].response.usage.cache_creation_input_tokens` and `cache_read_input_tokens` directly (the harness captures the full SDK `Message`, which includes these fields without any harness changes).
- **Regex over exact match:** use `.toMatch(/haiku/i)` for model assertions, not string equality.
- **Array find:** use `.find(b => b.type === "tool_use")` over index-based access for content blocks.

---

## Exercise.md structure requirements

All 6 required sections per the exercise contract, applied to the caching track:

1. **`# Exercise <NN> — <title>`** — H1 matching `meta.json.title`. The `<NN>` is the 2-digit exercise number within the track (01–05).

2. **`## Concepto` / `## Concept`** — What prompt caching is and why it matters BEFORE touching code. Must include:
   - The core analogy: caching as "saving compiled work" — you pay once to store, then read cheap.
   - The token threshold: Haiku 4.5 requires ≥4,096 tokens to activate caching.
   - The pricing math relevant to the specific exercise (e.g., 0.1× for reads, 1.25× for 5min writes, 2× for 1h writes, break-even formula for exercise 04).
   - For exercise 03: the 4-breakpoint limit and why it matters.
   - No code in this section — concepts only.

3. **`## Docs & referencias` / `## Docs & references`** — Numbered list of canonical URLs only:
   - `https://docs.claude.com/en/docs/build-with-claude/prompt-caching` — primary for all exercises.
   - `https://docs.anthropic.com/en/api/messages` — API reference (system blocks, cache_control shape).
   - `https://docs.anthropic.com/en/docs/about-claude/models` — model IDs and thresholds.
   - For exercise 05: add the tool use guide URL.
   - No blog posts, YouTube, or third-party links in v1.

4. **`## Tu tarea` / `## Your task`** — Step-by-step numbered list of what the learner must implement in `starter.ts`. Should reference specific function names, field names (`cache_control`, `ttl`), and what to return.

5. **`## Cómo verificar` / `## How to verify`** — Commands plus bullet list of what tests check:
   ```
   aidev verify <id>
   ```
   Then a bullet list mirroring the test assertions (in plain language, not code).

6. **`## Concepto extra (opcional)` / `## Extra concept (optional)`** — Production patterns specific to each exercise:
   - Exercise 01: cache invalidation via content change (caches are keyed on exact prefix hash).
   - Exercise 02: monitoring cache hit rate in production via usage aggregation.
   - Exercise 03: ordering breakpoints (1h blocks before 5min blocks).
   - Exercise 04: estimating real amortization given session length and request frequency.
   - Exercise 05: cache hygiene in conversational apps — trimming history to stay under 4 breakpoints.

---

## Out of scope (delta-wise)

- No new tracks beyond `02-caching` in this change.
- No harness changes — the SDK `Message` type already exposes `cache_creation_input_tokens` and `cache_read_input_tokens`; the harness captures the full `Message` object.
- No new `aidev` CLI commands or modifications to existing commands.
- No batch API caching, vision caching, or document caching.
- No track-level `README.md`.
- No model other than Haiku 4.5 in this track.
- `render.ts` cache field display: if `aidev run` does not currently render cache fields in the usage table, that is a stretch goal, not a blocker for this change. Spec does not require it.

---

## Gaps and open items

1. **`render.ts` cache field rendering:** The explore artifact flagged `render.ts` as not rendering `cache_*` fields in `aidev run` output. This is out of scope for this spec but SHOULD be tracked as a follow-up (cosmetic, does not affect `aidev verify`).
2. **`breakEvenCalls` exact formula:** The spec asserts a range check (1 ≤ result ≤ 20) rather than an exact value. The design phase should pin the exact formula and add one exact-output unit test for a known input.
3. **`cache_creation` vs `cache_creation_input_tokens` granularity:** The Anthropic API currently only surfaces `cache_creation_input_tokens` as a flat field (not split by TTL). The `cache_creation.ephemeral_5m_input_tokens / ephemeral_1h_input_tokens` extension is forward-looking — `cost.ts` must handle absent/partial objects gracefully. The apply phase should verify actual SDK types to confirm field availability.

---

## Skill resolution

`skill_resolution: injected`
