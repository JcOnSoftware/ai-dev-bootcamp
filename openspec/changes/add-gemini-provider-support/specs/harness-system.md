# Spec: Harness system extension (Gemini)

Delta spec — changes on top of the current harness dispatcher that supports anthropic + openai.

## Requirements

### R1 — Dispatcher routes to Gemini sub-harness

**Scenarios:**
- GIVEN `AIDEV_PROVIDER=gemini` WHEN `runUserCode()` is called THEN it delegates to `runUserCodeGemini()`.
- GIVEN `AIDEV_PROVIDER=gemini` AND the exercise uses `@google/genai` WHEN run THEN calls to `Models.prototype.generateContent` are intercepted and captured.

### R2 — Gemini sub-harness captures non-streaming calls

**Scenarios:**
- GIVEN an exercise calls `ai.models.generateContent({ model, contents, config })` WHEN run THEN `CapturedCallGemini` records: `{ provider: "gemini", method: "generateContent", model, contents, config, response, usageMetadata }`.
- GIVEN the exercise supplies `tools` inside `config` THEN the captured call preserves them for test assertions.

### R3 — Gemini sub-harness captures streaming calls

**Scenarios:**
- GIVEN an exercise calls `ai.models.generateContentStream(...)` WHEN run THEN the returned async iterable is proxied transparently to the user code AND each chunk is captured.
- GIVEN the stream completes THEN `CapturedCallGemini` records the final aggregated response including cumulative `usageMetadata`.
- IMPORTANT: the return value is an async iterable directly (NOT a Promise wrapping one), so the interception proxies the iterator, not a `.then()`.

### R4 — Gemini sub-harness captures embeddings

**Scenarios:**
- GIVEN an exercise calls `ai.models.embedContent({ model, contents })` WHEN run THEN `CapturedCallGemini` records `{ method: "embedContent", model, embedding: number[] }`.

### R5 — HarnessResult is discriminated by provider

**Scenarios:**
- GIVEN Gemini run completes THEN `HarnessResultGemini.provider === "gemini"` so callers can narrow the union.

## Out-of-scope (fallback)

- Live API (`ai.live.connect`) WebSocket interception — gated on B0-T00 spike. If infeasible, track 06 defers to v3.1.
