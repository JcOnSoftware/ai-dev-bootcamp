# Design: add-gemini-provider-support

## Architecture principle

**Zero-friction extension**. The v2.0 singleton + dispatcher architecture was designed for this. No structural changes — just new branches in switches, new entries in union types, new files in known locations.

## Harness design

### Current dispatcher (reference)

```ts
// code/packages/runner/src/harness.ts (current)
const provider = process.env["AIDEV_PROVIDER"] ?? "anthropic";
switch (provider) {
  case "anthropic": return runUserCodeAnthropic(filePath, options);
  case "openai":    return runUserCodeOpenAI(filePath, options) as unknown as HarnessResult;
  default:          throw new HarnessError(`Unsupported provider: ${provider}`);
}
```

### Target dispatcher

```ts
// harness.ts (target)
import { runUserCodeGemini, type HarnessResultGemini } from "./harness-gemini.ts";
// ...
switch (provider) {
  case "anthropic": return runUserCodeAnthropic(filePath, options);
  case "openai":    return runUserCodeOpenAI(filePath, options) as unknown as HarnessResult;
  case "gemini":    return runUserCodeGemini(filePath, options) as unknown as HarnessResult;
  default:          throw new HarnessError(`Unsupported provider: ${provider}`);
}
```

### `harness-gemini.ts` skeleton

```ts
import { GoogleGenAI } from "@google/genai";
import { HarnessError, type RunOptions } from "./types.ts";

export interface CapturedCallGemini {
  provider: "gemini";
  method: "generateContent" | "generateContentStream" | "embedContent";
  model: string;
  contents: unknown;
  config?: unknown;
  response?: unknown;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

export interface HarnessResultGemini {
  provider: "gemini";
  calls: CapturedCallGemini[];
  userReturn: unknown;
}

export async function runUserCodeGemini(filePath: string, options: RunOptions = {}): Promise<HarnessResultGemini> {
  // 1. Get Models prototype: Object.getPrototypeOf(new GoogleGenAI({apiKey:"x"}).models)
  // 2. Patch *Internal methods on the prototype — see "Patching strategy" below.
  //    Targets: generateContentInternal, generateContentStreamInternal, embedContentInternal
  // 3. Each patch calls original.call(this, params), captures args + response.
  // 4. Dynamic import user file
  // 5. Await default export run()
  // 6. Restore original *Internal methods in finally
}
```

### Patching strategy — critical finding from B0-T00 spike

**The public methods (`generateContent`, `generateContentStream`, `embedContent`) are NOT on the prototype — they are INSTANCE-LEVEL bindings added in the `Models` constructor.** Monkey-patching the prototype for those names has NO effect on instance calls.

**Correct strategy**: patch the `*Internal` variants that ARE on the prototype.

```
Models.prototype own-properties (excerpt):
  generateContentInternal         ← PATCH THIS
  generateContentStreamInternal   ← PATCH THIS
  embedContentInternal            ← PATCH THIS
  + many private helpers (processAfcStream, initAfcToolsMap, etc.)

Models instance own-properties:
  generateContent        ← thin wrapper, delegates to Internal
  generateContentStream  ← thin wrapper, delegates to Internal
  embedContent           ← thin wrapper, delegates to Internal
  apiClient              ← HTTP client instance
```

Public wrappers delegate via `this.generateContentInternal(params)` etc. Patching the Internal method on the prototype intercepts every instance's call. The outer public wrapper's pre-processing (param normalization, type validation) still runs — we sit BELOW it.

Spike evidence (`packages/runner/scripts/gemini-spike.ts`): patching all three Internals captures 3 calls when user code calls 3 public methods, with correct arg keys. Async-iterable yielding works for `generateContentStreamInternal`.

### Streaming — async iterable contract

`generateContentStream()` returns a **Promise that resolves to an async iterable directly** (NOT a Promise of a response wrapping a stream field).

Both the public method AND `generateContentStreamInternal` return async iterables. Our patched Internal must return `AsyncGenerator` or `AsyncIterable<Chunk>` so the public wrapper's iteration works transparently.

The proxy must:
1. Call `originalInternal.call(this, params)` → get the async iterable.
2. Wrap it in a proxy async-iterable: each `next()` forwards the chunk to user code AND pushes to `CapturedCallGemini.chunks`.
3. On iterator exhaustion, aggregate `usageMetadata` from the final chunk for the cost module.

## Cost table extension

Add to `MODEL_PRICES.families` in `code/packages/cli/src/cost.ts`:

```ts
// Gemini (prices per 1M tokens, USD)
{ match: /gemini-2\.5-flash-lite/i, input: 0.10, output: 0.40 },
{ match: /gemini-2\.5-flash$/i,     input: 0.30, output: 2.50 },
{ match: /gemini-2\.5-pro/i,        input: 1.25, output: 10.00 },
```

Cache multipliers (verify at B4-T03): Gemini uses implicit caching with automatic discount. For explicit caching via `ai.caches`, read-hit is discounted proportionally. Document `CACHE_MULTIPLIERS_GEMINI` if different from Anthropic.

## Usage normalization

Add `normalizeGeminiUsage(usageMetadata)` in `cost.ts`:

```ts
interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  cachedContentTokenCount?: number;
  thoughtsTokenCount?: number;
}

export function normalizeGeminiUsage(u: GeminiUsage): Usage {
  return {
    input_tokens: u.promptTokenCount ?? 0,
    output_tokens: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
    cache_read_input_tokens: u.cachedContentTokenCount ?? 0,
  };
}
```

## Render extension

Add to `render.ts`:

```ts
interface SdkGeminiResponse {
  candidates: Array<{ content: { parts: Array<{ text?: string }> } }>;
  usageMetadata?: GeminiUsage;
}

export function isGeminiResponse(r: unknown): r is SdkGeminiResponse { /* ... */ }
export function extractTextFromGemini(r: SdkGeminiResponse): string { /* concatenate text parts */ }
```

## Key validation (init.ts)

```ts
if (newProvider === "gemini" && !value.startsWith("AIza")) {
  return "That doesn't look like a Google Gemini key (usually starts with AIza...)";
}
```

**Note**: soft warning only — Google Cloud service accounts use different key formats. Don't hard-exit on format mismatch; just warn.

## i18n strings (new keys)

| Key | en.json | es.json |
|---|---|---|
| `init.provider_prompt` | (update list to include "Google (Gemini)") | (update) |
| `init.key_invalid_gemini` | "That doesn't look like a Gemini key (usually AIza...)" | "Esa clave no parece de Gemini (usualmente empieza con AIza...)" |
| `verify.no_gemini_key` | "GEMINI_API_KEY not set..." | "GEMINI_API_KEY no está configurada..." |
| `progress.header_gemini` | "Gemini" | "Gemini" |

## Exercise authoring conventions

- **Canonical doc root**: `ai.google.dev/gemini-api/docs` — use in `// Docs:` headers.
- **Default model**: `gemini-2.5-flash-lite` (except where concept demands otherwise, e.g. track 02 explicit caching often uses `gemini-2.5-flash`).
- **Track 06 (Live API)**: bound to the B0-T00 spike outcome. If spike fails, drop track.

## Ordering (7 batches, DAG)

```
B0 (spike + deps) → B1 (types) → B2 (config) → B3 (CLI) → B4 (commands/cost/render) → B5 (harness split) → B6 (30 exercises) → B7 (CI + docs + verify)
```

B6 internally parallelizable by track (each track = 5 exercises, self-contained).

## Testing strategy

Follow strict TDD (project mode ON):
- RED: write failing test before code.
- GREEN: minimal implementation to pass.
- REFACTOR: only if safe under green tests.

Integration tests for harness + exercises hit real Gemini API. CI runs them weekly via `.github/workflows/health-check.yml`.
