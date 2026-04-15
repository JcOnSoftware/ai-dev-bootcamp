# Tasks — add-prompt-caching-track

**Change:** `add-prompt-caching-track`
**Phase:** tasks
**Date:** 2026-04-14
**Artifact store:** hybrid (engram + openspec)

---

## Batch 1 — Infrastructure: cost.ts extension + fixture

> Gate: `bun test packages/cli` green + `bunx tsc --noEmit` clean before Batch 2.

### 1.1 Test-first: add 7 new cases to `cost.test.ts`

File: `code/packages/cli/src/cost.test.ts`

Add a new `describe("estimateCost — cache-aware")` block with these cases (in order):
1. **Backward compat**: existing usage object without cache fields → same result as before.
2. **5min write (flat field)**: `cache_creation_input_tokens: 5000, input_tokens: 0, output_tokens: 0` → cost > 0, multiplied at 1.25× (haiku input = $1/M → 5000 * 1.25 / 1_000_000 = ~$0.000006).
3. **1h write**: `cache_creation: { ephemeral_1h_input_tokens: 5000 }` → cost at 2.0× multiplier.
4. **Cache read**: `cache_read_input_tokens: 5000, input_tokens: 0, output_tokens: 0` → cost at 0.1× multiplier (< 5min write cost).
5. **Mixed**: `input_tokens: 100, cache_creation_input_tokens: 3000, cache_read_input_tokens: 2000, output_tokens: 50` → combined sum of all components, result is a string starting with `~$`.
6. **Fallback branch**: `cache_creation: { ephemeral_5m_input_tokens: 4000 }` and `cache_creation_input_tokens: 0` → cost at 1.25× on 4000 tokens.
7. **Zero cache fields (explicit)**: `cache_creation_input_tokens: 0, cache_read_input_tokens: 0` + normal tokens → result matches non-cache call.

**Note:** All tests will FAIL (compilation error or assertion failure) until tasks 1.2–1.3 are complete. That is expected and correct per TDD.

### 1.2 Add `CacheCreation` type and extend `Usage` interface in `cost.ts`

File: `code/packages/cli/src/cost.ts`

Add (above `ModelFamily`):
```ts
export interface CacheCreation {
  ephemeral_5m_input_tokens?: number;
  ephemeral_1h_input_tokens?: number;
}
```

Extend `Usage`:
```ts
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation?: CacheCreation;
}
```

Export both (`CacheCreation` exported — exercise 02 uses `CacheUsage` locally but imports base `Usage`).

### 1.3 Implement cache-aware cost branching in `estimateCost`

File: `code/packages/cli/src/cost.ts`

Inside `estimateCost`, after computing `hit`, replace the single cost line with:
```ts
const READ_MULT    = 0.1;
const WRITE_5M_MULT = 1.25;
const WRITE_1H_MULT = 2.0;

// Resolve write tokens (prefer granular breakdown; fallback to flat field attributed to 5m)
const write5m =
  (usage.cache_creation?.ephemeral_5m_input_tokens ?? 0) +
  (usage.cache_creation?.ephemeral_1h_input_tokens === undefined
    ? (usage.cache_creation_input_tokens ?? 0)
    : 0);
const write1h = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;
const readTokens = usage.cache_read_input_tokens ?? 0;

const cost =
  (usage.input_tokens / 1_000_000) * hit.input +
  (usage.output_tokens / 1_000_000) * hit.output +
  (write5m / 1_000_000) * hit.input * WRITE_5M_MULT +
  (write1h / 1_000_000) * hit.input * WRITE_1H_MULT +
  (readTokens / 1_000_000) * hit.input * READ_MULT;
```

Signature unchanged: `estimateCost(model: string, usage: Usage): string | null`.

### 1.4 Run unit tests and typecheck

From `code/`:
```
bunx tsc --noEmit
bun test packages/cli
```
All 7 new cases + all existing cases must pass. Fix any type errors before proceeding.

### 1.5 Create `fixtures/long-system-prompt.ts`

File: `code/packages/exercises/02-caching/fixtures/long-system-prompt.ts`

Create parent dir `02-caching/fixtures/` first (no `meta.json`, no test file — this is not an exercise).

Content requirements:
- Named export only: `export const LONG_SYSTEM_PROMPT: string`
- Technical prose: REST API design best practices.
- Target: ~4,300 tokens (~17,200 characters). Use the rule of thumb: 1 token ≈ 4 chars.
- Must exceed Haiku 4.5's 4,096-token cache minimum threshold with margin.
- Content structure (to hit token count organically): cover 8–10 topics such as: URI naming conventions, HTTP verbs semantics, status code usage, versioning strategies, pagination patterns, error response schemas, authentication flows, rate limiting design, idempotency keys, and hypermedia/HATEOAS overview. Write each topic as 2–3 paragraphs of dense technical prose.
- No placeholder lorem ipsum. Real, learner-readable content.

### 1.6 Add a length guard test for the fixture

File: `code/packages/exercises/02-caching/fixtures/long-system-prompt.test.ts`

```ts
import { describe, it, expect } from "bun:test";
import { LONG_SYSTEM_PROMPT } from "./long-system-prompt.ts";

describe("LONG_SYSTEM_PROMPT fixture", () => {
  it("exceeds 16,000 characters (rough token guard for 4,096-token minimum)", () => {
    expect(LONG_SYSTEM_PROMPT.length).toBeGreaterThan(16_000);
  });

  it("is a non-empty string", () => {
    expect(typeof LONG_SYSTEM_PROMPT).toBe("string");
    expect(LONG_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });
});
```

Run: `bun test packages/exercises/02-caching/fixtures/` — must be green.

### 1.7 Commit Batch 1

```
git add code/packages/cli/src/cost.ts code/packages/cli/src/cost.test.ts \
        code/packages/exercises/02-caching/fixtures/
git commit -m "feat(cost): extend estimateCost with cache-aware pricing multipliers"
```

---

## Batch 2 — Exercise `01-basic-caching`

> Gate: `AIDEV_TARGET=solution bun test packages/exercises/02-caching/01-basic-caching` green + `aidev verify 01-basic-caching --solution` green before Batch 3.

### 2.1 Create skeleton directories

```
code/packages/exercises/02-caching/01-basic-caching/
code/packages/exercises/02-caching/01-basic-caching/es/
code/packages/exercises/02-caching/01-basic-caching/en/
```

### 2.2 Test-first: write `tests.test.ts`

File: `code/packages/exercises/02-caching/01-basic-caching/tests.test.ts`

Assertions (structural, no LLM text):
1. `result.calls` has length 2.
2. Call 1 request: `system` is an array; at least one block has `cache_control.type === "ephemeral"`.
3. Call 1 response: `usage.cache_creation_input_tokens > 0`.
4. Call 1 response: `usage.cache_read_input_tokens === 0`.
5. Call 2 request: `system` is an array; at least one block has `cache_control.type === "ephemeral"`.
6. Call 2 response: `usage.cache_read_input_tokens > 0`.
7. Both requests: `request.model` matches `/haiku/i`.
8. Both responses: contain at least one `text` content block.

Pattern:
```ts
import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-basic-caching", () => {
  let result: HarnessResult;
  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) throw new Error("ANTHROPIC_API_KEY not set");
    result = await runUserCode(EXERCISE_FILE);
  });
  // ... tests here
});
```

### 2.3 Write `starter.ts`

File: `code/packages/exercises/02-caching/01-basic-caching/starter.ts`

```ts
// Docs:
//   Prompt caching guide : https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching
//   Model IDs            : https://platform.claude.com/docs/en/docs/about-claude/models/overview
//   Messages API         : https://platform.claude.com/docs/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../../fixtures/long-system-prompt.ts";

/**
 * TODO:
 *   1. Instancia un cliente Anthropic.
 *   2. Definí el system prompt como array de content blocks con cache_control.
 *   3. Hacé dos llamadas secuenciales con el mismo system block cacheado.
 *   4. Retorná { calls: [call1Response, call2Response] } — los tests inspeccionan ambas.
 *
 * Modelo recomendado: claude-haiku-4-5-20251001, max_tokens: 256
 */
export default async function run() {
  throw new Error("TODO: implementá el ejercicio. Leé es/exercise.md para el contexto.");
}
```

### 2.4 Confirm `tests.test.ts` FAILS against `starter.ts`

From `code/`:
```
AIDEV_TARGET=starter bun test ./packages/exercises/02-caching/01-basic-caching/tests.test.ts
```
Expected: at least one test fails (the TODO throw means `result` is never set). This confirms the test is properly guarding.

### 2.5 Write `solution.ts`

File: `code/packages/exercises/02-caching/01-basic-caching/solution.ts`

Minimal implementation:
- Create `Anthropic` client.
- Define `systemBlock` as `[{ type: "text", text: LONG_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }]`.
- Make `call1 = await client.messages.create({ model: "claude-haiku-4-5-20251001", max_tokens: 256, system: systemBlock, messages: [{ role: "user", content: "Summarize REST API best practices in one sentence." }] })`.
- Make `call2` with identical params.
- `return { calls: [call1, call2] }` — harness captures both via monkey-patch.

### 2.6 Verify `solution.ts` passes all tests

From `code/`:
```
AIDEV_TARGET=solution bun test ./packages/exercises/02-caching/01-basic-caching/tests.test.ts
```
All 8 assertions must be green. Fix solution if any fail.

### 2.7 Write `es/exercise.md`

File: `code/packages/exercises/02-caching/01-basic-caching/es/exercise.md`

6 required sections (contract):
1. `# Caché básico de prompts`
2. **Concepto**: explain what prompt caching is, the 4,096-token minimum threshold for Haiku 4.5, the `cache_control: { type: "ephemeral" }` marker, and the 5-minute TTL default. Use the "parking a bus in a garage" analogy (write once, re-enter fast).
3. **Docs y referencias**: canonical URLs only — `platform.claude.com/docs/en/docs/build-with-claude/prompt-caching`, `platform.claude.com/docs/en/api/messages`, `platform.claude.com/docs/en/docs/about-claude/models/overview`.
4. **Tu tarea**: numbered steps — (1) importar `LONG_SYSTEM_PROMPT`; (2) armar el system block como array con `cache_control`; (3) hacer dos llamadas secuenciales; (4) retornar `{ calls: [call1, call2] }`.
5. **Cómo verificar**: `aidev verify 01-basic-caching` + `aidev verify 01-basic-caching --solution`. Bullet assertions to expect: `usage.cache_creation_input_tokens > 0` en call 1; `usage.cache_read_input_tokens > 0` en call 2.
6. **Concepto extra**: production patterns — warm cache on server startup, avoid cold caches in serverless by pre-warming, monitor cache hit ratio via `cache_read / (cache_read + cache_creation)`.

### 2.8 Write `en/exercise.md`

File: `code/packages/exercises/02-caching/01-basic-caching/en/exercise.md`

Same 6-section structure, equivalent content in English. Section 1: `# Basic Prompt Caching`. Analogy: "think of caching as storing a pre-compiled document — the first call does the compilation work, every subsequent call skips it." Same technical depth as the Spanish version.

### 2.9 Write `meta.json`

File: `code/packages/exercises/02-caching/01-basic-caching/meta.json`

```json
{
  "id": "01-basic-caching",
  "track": "02-caching",
  "title": "Basic prompt caching",
  "version": "1.0.0",
  "valid_until": "2026-10-15",
  "concepts": ["prompt-caching", "cache-control", "system-block", "cache-creation-tokens"],
  "estimated_minutes": 15,
  "requires": ["01-first-call"],
  "model_cost_hint": "~$0.003 per verify run (2× Haiku + 4k-token system)",
  "locales": ["es", "en"]
}
```

### 2.10 Smoke-check `aidev list`

From `code/`:
```
node packages/cli/src/index.ts list
```
(or `aidev list` if globally linked). Verify `01-basic-caching` appears under track `02-caching`.

### 2.11 Verify against real API

From `code/`:
```
aidev verify 01-basic-caching --solution
```
Must pass. Expected cost: < $0.005. If cost > $0.01, check fixture token count and `max_tokens`.

### 2.12 Commit Batch 2

```
git add code/packages/exercises/02-caching/01-basic-caching/
git commit -m "feat(exercises/02-caching): add 01-basic-caching exercise"
```

---

## Batch 3 — Exercise `02-cache-hit-metrics`

> Gate: `AIDEV_TARGET=solution bun test packages/exercises/02-caching/02-cache-hit-metrics` green + `aidev verify 02-cache-hit-metrics --solution` green before Batch 4.
> Depends on: Batch 1 (cost.ts extension) and Batch 2 (`01-basic-caching` as chained prereq).

### 3.1 Create skeleton directories

```
code/packages/exercises/02-caching/02-cache-hit-metrics/
code/packages/exercises/02-caching/02-cache-hit-metrics/es/
code/packages/exercises/02-caching/02-cache-hit-metrics/en/
```

### 3.2 Test-first: write `tests.test.ts`

Two test groups: **unit** (no API key required) and **integration**.

Unit tests (no `beforeAll` guard, pure function):
```ts
import { cacheStats } from "./starter.ts"; // will throw TODO — expected failure
```
1. `cacheStats({ cache_read_input_tokens: 5000, cache_creation_input_tokens: 0, input_tokens: 50, output_tokens: 100 }, "claude-haiku-4-5-20251001")` returns object with keys `cached`, `created`, `regular`, `savings_pct`, `effective_cost_usd`.
2. `stats.cached === 5000`.
3. `stats.savings_pct` is a number between 0 and 100.

Integration tests (guarded by `ANTHROPIC_API_KEY`):
4. `result.calls` has length 2.
5. Returned stats object has all 5 keys present.
6. `stats.savings_pct > 50`.
7. `stats.effective_cost_usd` is a positive finite number.
8. `result.calls[1].request.model` matches `/haiku/i`.

### 3.3 Write `starter.ts`

```ts
// Docs:
//   Prompt caching guide : https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching
//   Messages API usage   : https://platform.claude.com/docs/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../../fixtures/long-system-prompt.ts";
import { estimateCost } from "@aidev/cli/src/cost.ts"; // import path — adjust if needed

export interface CacheUsage {
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  input_tokens: number;
  output_tokens: number;
}

export interface CacheStats {
  cached: number;
  created: number;
  regular: number;
  savings_pct: number;
  effective_cost_usd: number;
}

/**
 * TODO: implementá cacheStats.
 * Calcula estadísticas de caché a partir del objeto usage.
 * savings_pct = cuánto porcentaje del costo se ahorró vs leer todos los tokens a precio full.
 * effective_cost_usd = costo real incluyendo multipliers de caché.
 */
export function cacheStats(usage: CacheUsage, model: string): CacheStats {
  throw new Error("TODO: implementá cacheStats.");
}

/**
 * TODO: implementá run().
 * Hacé 2 llamadas (1ra para calentar el caché, 2da para leer) y
 * retorná cacheStats aplicado al usage de la segunda llamada.
 */
export default async function run() {
  throw new Error("TODO: implementá run().");
}
```

### 3.4 Confirm unit + integration tests FAIL against `starter.ts`

```
AIDEV_TARGET=starter bun test ./packages/exercises/02-caching/02-cache-hit-metrics/tests.test.ts
```
Expected: unit tests fail on `cacheStats` throw; integration test fails similarly. Confirm and proceed.

### 3.5 Write `solution.ts`

`cacheStats` implementation:
- `cached = usage.cache_read_input_tokens`
- `created = usage.cache_creation_input_tokens`
- `regular = usage.input_tokens`
- `savings_pct`: compare actual cost vs hypothetical all-regular cost. Formula: `((full_cost - actual_cost) / full_cost) * 100` where `full_cost = (cached + created + regular) / 1_000_000 * inputPrice`.
- `effective_cost_usd`: parse `estimateCost(model, usage)` string → number (strip `~$`).

`run()`:
- Two sequential calls with `LONG_SYSTEM_PROMPT` cached.
- Return `cacheStats(call2.usage, model)`.

### 3.6 Verify `solution.ts` passes all tests

```
AIDEV_TARGET=solution bun test ./packages/exercises/02-caching/02-cache-hit-metrics/tests.test.ts
```
All 8 assertions green. Fix if any fail.

### 3.7 Write `es/exercise.md` (6 sections)

1. `# Métricas de cache hit`
2. **Concepto**: read price = 0.1× input price; write 5m = 1.25×; explain why cache reads are cheap; savings formula.
3. **Docs y referencias**: canonical URLs.
4. **Tu tarea**: (1) implementar `cacheStats`; (2) exportarla por nombre; (3) `run()` con 2 llamadas; (4) retornar stats de la segunda.
5. **Cómo verificar**: commands + assertions to expect.
6. **Concepto extra**: `savings_pct > 80%` typical for large system prompts; monitoring cache hit ratio in production; break-even amortization math intro.

### 3.8 Write `en/exercise.md` (6 sections)

Equivalent content in English. Section 1: `# Cache Hit Metrics`.

### 3.9 Write `meta.json`

```json
{
  "id": "02-cache-hit-metrics",
  "track": "02-caching",
  "title": "Cache hit metrics",
  "version": "1.0.0",
  "valid_until": "2026-10-15",
  "concepts": ["cache-read-tokens", "cache-pricing", "savings-calculation", "cost-estimation"],
  "estimated_minutes": 20,
  "requires": ["01-basic-caching"],
  "model_cost_hint": "~$0.004 per verify run (2× Haiku + cache read)",
  "locales": ["es", "en"]
}
```

### 3.10 Smoke-check and verify

```
aidev list  # 02-cache-hit-metrics appears under 02-caching
aidev verify 02-cache-hit-metrics --solution
```

### 3.11 Commit Batch 3

```
git add code/packages/exercises/02-caching/02-cache-hit-metrics/
git commit -m "feat(exercises/02-caching): add 02-cache-hit-metrics exercise"
```

---

## Batch 4 — Exercise `03-multi-breakpoint`

> Gate: `AIDEV_TARGET=solution bun test packages/exercises/02-caching/03-multi-breakpoint` green + `aidev verify 03-multi-breakpoint --solution` green before Batch 5.
> Depends on: Batch 2 (cached system block pattern established).

### 4.1 Create skeleton directories

```
code/packages/exercises/02-caching/03-multi-breakpoint/
code/packages/exercises/02-caching/03-multi-breakpoint/es/
code/packages/exercises/02-caching/03-multi-breakpoint/en/
```

### 4.2 Test-first: write `tests.test.ts`

All integration, guarded by `ANTHROPIC_API_KEY`:
1. `result.calls` has length 2.
2. Call 1 request: `system` array has at least one block with `cache_control.type === "ephemeral"`.
3. Call 2 request: `tools` array exists; the last tool has `cache_control` present (anywhere on the tool object — check `JSON.stringify(lastTool).includes('"ephemeral"')`).
4. Call 2 request: total blocks with `cache_control` across `system`, `tools`, and `messages` is >= 3 and <= 4.
5. Call 2 response: `usage.cache_read_input_tokens > 0`.
6. Both requests: `request.model` matches `/haiku/i`.
7. Call 2 response: content has at least one block.

Helper to count total `cache_control` blocks across all locations:
```ts
function countCacheControlBlocks(req: typeof result.calls[0]["request"]): number {
  let count = 0;
  for (const b of (req.system as any[] ?? [])) if (b.cache_control) count++;
  for (const t of (req.tools ?? [])) if (JSON.stringify(t).includes('"ephemeral"')) count++;
  for (const m of (req.messages ?? [])) {
    const content = Array.isArray(m.content) ? m.content : [];
    for (const b of content) if ((b as any).cache_control) count++;
  }
  return count;
}
```

### 4.3 Write `starter.ts`

```ts
// Docs:
//   Prompt caching guide : https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching
//   Tool use guide       : https://platform.claude.com/docs/en/docs/build-with-claude/tool-use
//   Messages API         : https://platform.claude.com/docs/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../../fixtures/long-system-prompt.ts";

/**
 * TODO: Implementá 3 breakpoints de caché en una sola conversación:
 *   Breakpoint 1 — system block con cache_control
 *   Breakpoint 2 — última tool definition con cache_control
 *   Breakpoint 3 — assistant message en el historial con cache_control en su último content block
 *
 *   Hacé 2 llamadas: warmup (turn 1) + hit (turn 2).
 *   Retorná { calls: [call1Response, call2Response] }.
 *
 * IMPORTANTE: el límite es 4 breakpoints por request. No lo superes.
 */
export default async function run() {
  throw new Error("TODO: implementá run().");
}
```

### 4.4 Confirm tests FAIL against `starter.ts`

```
AIDEV_TARGET=starter bun test ./packages/exercises/02-caching/03-multi-breakpoint/tests.test.ts
```

### 4.5 Write `solution.ts`

Implementation guide:
- System block: `[{ type: "text", text: LONG_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }]`
- Define 2 tools; add `cache_control: { type: "ephemeral" }` to the last tool object.
- Turn 1: `messages: [{ role: "user", content: "Name two HTTP verbs." }]`
- Take turn 1 response; build turn 2 messages including prior assistant turn with `cache_control: { type: "ephemeral" }` on its last content block.
- Turn 2: `messages: [...prior, { role: "user", content: "Now name two status codes." }]`
- Include `// WARNING: Hard limit is 4 cache_control breakpoints per request. Adding a 5th will be silently ignored.` as a comment in the file.

### 4.6 Verify `solution.ts` passes all tests

```
AIDEV_TARGET=solution bun test ./packages/exercises/02-caching/03-multi-breakpoint/tests.test.ts
```
All 7 assertions green.

### 4.7 Write `es/exercise.md` (6 sections)

1. `# Múltiples breakpoints de caché`
2. **Concepto**: explain the 3 breakpoint locations (system, tools, messages), the 4-breakpoint hard limit, ordering rule (cache persists everything before the breakpoint).
3. **Docs y referencias**: canonical URLs.
4. **Tu tarea**: numbered steps covering 3 breakpoints + 2 calls.
5. **Cómo verificar**: commands + what to observe.
6. **Concepto extra**: production use — cache the system + tool schema on startup, append user history without re-caching; ordering matters (furthest breakpoint = largest prefix = most savings).

### 4.8 Write `en/exercise.md` (6 sections)

Section 1: `# Multiple Cache Breakpoints`. Equivalent content in English.

### 4.9 Write `meta.json`

```json
{
  "id": "03-multi-breakpoint",
  "track": "02-caching",
  "title": "Multiple cache breakpoints",
  "version": "1.0.0",
  "valid_until": "2026-10-15",
  "concepts": ["cache-breakpoints", "tool-caching", "message-history-caching", "4-breakpoint-limit"],
  "estimated_minutes": 25,
  "requires": ["02-cache-hit-metrics"],
  "model_cost_hint": "~$0.005 per verify run (2× Haiku + tools + history)",
  "locales": ["es", "en"]
}
```

### 4.10 Smoke-check and verify

```
aidev list
aidev verify 03-multi-breakpoint --solution
```

### 4.11 Commit Batch 4

```
git add code/packages/exercises/02-caching/03-multi-breakpoint/
git commit -m "feat(exercises/02-caching): add 03-multi-breakpoint exercise"
```

---

## Batch 5 — Exercise `04-ttl-extended`

> Gate: `AIDEV_TARGET=solution bun test packages/exercises/02-caching/04-ttl-extended` green + `aidev verify 04-ttl-extended --solution` green before Batch 6.
> Depends on: Batch 1 (cost.ts 2.0× multiplier used in breakEvenCalls rationale), Batch 3 (pricing concepts).

### 5.1 Create skeleton directories

```
code/packages/exercises/02-caching/04-ttl-extended/
code/packages/exercises/02-caching/04-ttl-extended/es/
code/packages/exercises/02-caching/04-ttl-extended/en/
```

### 5.2 Test-first: write `tests.test.ts`

Two groups: **unit** (no API) and **integration**.

Unit tests:
1. `breakEvenCalls(4200, 1.0)` returns a positive integer.
2. `breakEvenCalls(4200, 1.0)` satisfies `1 <= result <= 20` (sanity range for reasonable inputs).
3. `breakEvenCalls(10000, 1.0) >= breakEvenCalls(4200, 1.0)` — more tokens = same or more break-even calls. (This test validates monotonic-ish behavior.)
4. `typeof breakEvenCalls(4200, 1.0) === "number"` and `Number.isInteger(breakEvenCalls(4200, 1.0))`.

Integration (guarded by `ANTHROPIC_API_KEY`):
5. `result.calls` has length 2.
6. Call 1 request: `system` array has a block where `JSON.stringify(block).includes('"1h"')`.
7. Call 1 response: `usage.cache_creation_input_tokens > 0`.
8. Call 2 response: `usage.cache_read_input_tokens > 0`.
9. Both requests: `request.model` matches `/haiku/i`.

### 5.3 Write `starter.ts`

```ts
// Docs:
//   Prompt caching TTL   : https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching#extended-cache-ttl
//   Messages API         : https://platform.claude.com/docs/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../../fixtures/long-system-prompt.ts";

/**
 * TODO: Implementá breakEvenCalls.
 * Calcula el número mínimo de lecturas de caché para que el write 1h (2×)
 * sea más barato que hacer múltiples writes 5m (1.25× cada vez).
 *
 * Fórmula sugerida:
 *   costWrite1h = (cacheTokens / 1_000_000) * pricePerMillion * 2.0
 *   costWrite5m = (cacheTokens / 1_000_000) * pricePerMillion * 1.25
 *   costRead    = (cacheTokens / 1_000_000) * pricePerMillion * 0.1
 *   Buscar el mínimo N tal que costWrite1h + N*costRead < N*costWrite5m + costWrite5m
 *   (i.e., 1h write amortized over N reads is cheaper than re-writing every 5m)
 */
export function breakEvenCalls(cacheTokens: number, pricePerMillion: number): number {
  throw new Error("TODO: implementá breakEvenCalls.");
}

/**
 * TODO: Implementá run().
 * Usá cache_control: { type: "ephemeral", ttl: "1h" } en el system block.
 * Hacé 2 llamadas. Retorná { calls: [call1Response, call2Response] }.
 */
export default async function run() {
  throw new Error("TODO: implementá run().");
}
```

### 5.4 Confirm tests FAIL against `starter.ts`

```
AIDEV_TARGET=starter bun test ./packages/exercises/02-caching/04-ttl-extended/tests.test.ts
```

### 5.5 Write `solution.ts`

`breakEvenCalls` formula (pinned):
```
costWrite1h(N) = write1h + N * read  (one 1h write, then N reads)
costWrite5m(N) = N * write5m         (re-write every 5m, so N writes for N reads)
solve: write1h + N * read < N * write5m
→ write1h < N * (write5m - read)
→ N > write1h / (write5m - read)
→ result = Math.ceil(write1h / (write5m - read))
where write1h = tokens/1M * price * 2.0
      write5m = tokens/1M * price * 1.25
      read    = tokens/1M * price * 0.1
```

`run()`: Two calls with `cache_control: { type: "ephemeral", ttl: "1h" }` on system block. Print `breakEvenCalls` result to console (learner sees the math). Return `{ calls: [call1, call2] }`.

### 5.6 Verify `solution.ts` passes all tests

```
AIDEV_TARGET=solution bun test ./packages/exercises/02-caching/04-ttl-extended/tests.test.ts
```
All 9 assertions green.

### 5.7 Write `es/exercise.md` (6 sections)

1. `# TTL extendido: caché de 1 hora`
2. **Concepto**: 5min default vs 1h extended; 2× write premium; when it pays off (LLM-backed APIs with sustained traffic); the `ttl: "1h"` field.
3. **Docs y referencias**: canonical URLs + link to extended TTL section specifically.
4. **Tu tarea**: implement `breakEvenCalls` + run with 1h TTL.
5. **Cómo verificar**: commands + expected: `cache_creation_input_tokens > 0` on call 1, `cache_read_input_tokens > 0` on call 2.
6. **Concepto extra**: amortization math in production — if you have a 10k-token system prompt and 50 requests/hour, 1h TTL pays for itself after just 3 reads; monitoring TTL expiry via cache_creation spikes.

### 5.8 Write `en/exercise.md` (6 sections)

Section 1: `# Extended TTL: 1-Hour Caching`. Equivalent English content.

### 5.9 Write `meta.json`

```json
{
  "id": "04-ttl-extended",
  "track": "02-caching",
  "title": "Extended cache TTL",
  "version": "1.0.0",
  "valid_until": "2026-10-15",
  "concepts": ["ttl", "cache-write-1h", "break-even-analysis", "cache-amortization"],
  "estimated_minutes": 20,
  "requires": ["03-multi-breakpoint"],
  "model_cost_hint": "~$0.004 per verify run (2× Haiku + 1h write)",
  "locales": ["es", "en"]
}
```

### 5.10 Smoke-check and verify

```
aidev list
aidev verify 04-ttl-extended --solution
```

### 5.11 Commit Batch 5

```
git add code/packages/exercises/02-caching/04-ttl-extended/
git commit -m "feat(exercises/02-caching): add 04-ttl-extended exercise"
```

---

## Batch 6 — Exercise `05-caching-with-tools`

> Gate: `AIDEV_TARGET=solution bun test packages/exercises/02-caching/05-caching-with-tools` green + `aidev verify 05-caching-with-tools --solution` green before Batch 7.
> Depends on: Batch 4 (multi-breakpoint tool caching pattern) and general tool-use knowledge.

### 6.1 Create skeleton directories

```
code/packages/exercises/02-caching/05-caching-with-tools/
code/packages/exercises/02-caching/05-caching-with-tools/es/
code/packages/exercises/02-caching/05-caching-with-tools/en/
```

### 6.2 Test-first: write `tests.test.ts`

All integration, guarded by `ANTHROPIC_API_KEY`:
1. `result.calls` has length 2.
2. Call 1 request: `system` has at least one block with `cache_control.type === "ephemeral"`.
3. Call 1 request: `tools` array exists and has length >= 1.
4. Call 1 request: last tool has `cache_control` present anywhere (`JSON.stringify(lastTool).includes('"ephemeral"')`).
5. Call 1 response: content contains at least one block with `type === "tool_use"`.
6. Call 2 request: `tools` array still present with `cache_control` on last tool.
7. Call 2 response: `usage.cache_read_input_tokens > 0`.
8. Call 2 response: contains at least one content block.
9. Both requests: `request.model` matches `/haiku/i`.

### 6.3 Write `starter.ts`

```ts
// Docs:
//   Prompt caching guide : https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching
//   Tool use guide       : https://platform.claude.com/docs/en/docs/build-with-claude/tool-use
//   Messages API         : https://platform.claude.com/docs/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../../fixtures/long-system-prompt.ts";

/**
 * TODO: Combiná caché de prompts con tool use en 2 turnos:
 *   Turno 1: enviá un mensaje que dispare el uso de una herramienta.
 *            Cacheá el system block (BP1) y el último tool (BP2).
 *   Turno 2: enviá tool_result + siguiente mensaje.
 *            El segundo turno debería leer del caché (system + tools).
 *
 *   Retorná { calls: [call1Response, call2Response] }.
 */
export default async function run() {
  throw new Error("TODO: implementá run().");
}
```

### 6.4 Confirm tests FAIL against `starter.ts`

```
AIDEV_TARGET=starter bun test ./packages/exercises/02-caching/05-caching-with-tools/tests.test.ts
```

### 6.5 Write `solution.ts`

Implementation:
- Define 1 tool (e.g., `get_http_methods` that returns a list of HTTP verbs — simple, deterministic).
- System block: `LONG_SYSTEM_PROMPT` with `cache_control: { type: "ephemeral" }`.
- Tools array: tool with `cache_control: { type: "ephemeral" }` added to the tool object.
- Turn 1: `messages: [{ role: "user", content: "List all HTTP verbs using the get_http_methods tool." }]`
- Extract `tool_use` block from turn 1 response.
- Turn 2: `messages: [...turn1, assistantMsg, { role: "user", content: [{ type: "tool_result", tool_use_id: toolUseBlock.id, content: '["GET","POST","PUT","DELETE","PATCH","HEAD","OPTIONS"]' }, { type: "text", text: "Which one is idempotent?" }] }]`
- Return `{ calls: [call1, call2] }`.

### 6.6 Verify `solution.ts` passes all tests

```
AIDEV_TARGET=solution bun test ./packages/exercises/02-caching/05-caching-with-tools/tests.test.ts
```
All 9 assertions green.

### 6.7 Write `es/exercise.md` (6 sections)

1. `# Caché combinado con tool use`
2. **Concepto**: caching the tool schema is as valuable as caching the system prompt in agentic workflows; tool definitions are tokenized like text; `cache_control` on the last tool caches all tools before it.
3. **Docs y referencias**: canonical URLs for caching + tool use.
4. **Tu tarea**: define a tool, cache system + last tool, run 2-turn conversation with tool_result.
5. **Cómo verificar**: commands + `cache_read_input_tokens > 0` on turn 2.
6. **Concepto extra**: in production agentic loops, every tool call re-reads the cached system + tools prefix; cache all static context (system + tool schema) and only pass dynamic messages as uncached.

### 6.8 Write `en/exercise.md` (6 sections)

Section 1: `# Caching with Tool Use`. Equivalent English content.

### 6.9 Write `meta.json`

```json
{
  "id": "05-caching-with-tools",
  "track": "02-caching",
  "title": "Caching with tool use",
  "version": "1.0.0",
  "valid_until": "2026-10-15",
  "concepts": ["tool-caching", "agentic-caching", "multi-turn-caching", "tool-result"],
  "estimated_minutes": 30,
  "requires": ["04-ttl-extended"],
  "model_cost_hint": "~$0.007 per verify run (2× Haiku + tools + multi-turn)",
  "locales": ["es", "en"]
}
```

### 6.10 Smoke-check and verify

```
aidev list  # all 5 exercises visible under 02-caching
aidev verify 05-caching-with-tools --solution
```

### 6.11 Commit Batch 6

```
git add code/packages/exercises/02-caching/05-caching-with-tools/
git commit -m "feat(exercises/02-caching): add 05-caching-with-tools exercise"
```

---

## Batch 7 — Track-level validation + docs

> Gate: all tasks below complete before marking the change done.

### 7.1 TypeScript clean check

From `code/`:
```
bunx tsc --noEmit
```
Zero errors. Fix any type issues before proceeding.

### 7.2 Full test suite

From `code/`:
```
bun test
```
All tests green — unit tests (cost.ts, fixture length) + integration tests (5 exercises against real API). Fix any regressions.

### 7.3 Verify `aidev list` output

```
aidev list
```
Expected output shows a `02-caching` track group with exactly 5 exercises:
- `01-basic-caching`
- `02-cache-hit-metrics`
- `03-multi-breakpoint`
- `04-ttl-extended`
- `05-caching-with-tools`

Each with correct title matching `meta.json`.

### 7.4 Verify `aidev progress` output

```
aidev progress
```
Shows `02-caching: 0/5` (no exercises completed — learner starts from zero). Confirm the track entry appears.

### 7.5 Update `CONTRIBUTING.md` (fixtures/ convention)

File: `CONTRIBUTING.md` (project root, if it exists) or wherever track conventions are documented.

Add a paragraph under "Track conventions" (or create the section if absent):

> **Shared fixtures**: Each track may have a `fixtures/` directory at `code/packages/exercises/<track>/fixtures/`. Files here are NOT exercises — they have no `meta.json`, no `tests.test.ts`, and no `exercise.md`. They export shared data (e.g., `LONG_SYSTEM_PROMPT`) imported by exercises within the same track. Import path from within an exercise: `../../fixtures/<file>.ts`. The `fixtures/` dir MAY contain its own `*.test.ts` files if the fixture data itself needs a length/shape guard.

Only add this if `CONTRIBUTING.md` exists and has a section for track/exercise conventions. If the file doesn't exist, skip (do not create it).

### 7.6 Final commit for track validation

If 7.5 produced changes:
```
git add CONTRIBUTING.md
git commit -m "docs(contributing): document fixtures/ directory convention"
```

If no changes needed, skip.

### 7.7 Push to main

```
git push origin main
```

Watch CI (`.github/workflows/ci.yml` or equivalent) — confirm green.

---

## Summary

| Batch | Focus | Task count | Gate |
|-------|-------|-----------|------|
| 1 | `cost.ts` extension + fixture | 7 | `bun test packages/cli` + fixture test green |
| 2 | `01-basic-caching` | 12 | solution tests green + `aidev verify` green |
| 3 | `02-cache-hit-metrics` | 11 | solution tests green + `aidev verify` green |
| 4 | `03-multi-breakpoint` | 11 | solution tests green + `aidev verify` green |
| 5 | `04-ttl-extended` | 11 | solution tests green + `aidev verify` green |
| 6 | `05-caching-with-tools` | 11 | solution tests green + `aidev verify` green |
| 7 | Track validation + docs | 7 | full suite green + `aidev list` + CI green |

**Total:** 7 batches, 70 tasks.

---

## Dependencies and ordering constraints

- Batch 1 must complete before any exercise batch (exercises import `LONG_SYSTEM_PROMPT`; `02-cache-hit-metrics` imports `estimateCost` extended types).
- Exercises must be implemented in order (01 → 02 → 03 → 04 → 05) because each `meta.json` `requires` the prior exercise, and learner mental model builds cumulatively.
- Batch 7 depends on all exercise batches completing green.

## Cost budget

| Action | Est. cost | Count | Total |
|--------|-----------|-------|-------|
| `aidev verify --solution` per exercise | ~$0.005 | 5 | ~$0.025 |
| Iteration margin (2× safety) | — | — | ~$0.025 |
| **Total** | | | **< $0.05** |
