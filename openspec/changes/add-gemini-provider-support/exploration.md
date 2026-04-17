# Exploration: add-gemini-provider-support

## Goal
Add Gemini as third AI provider parallel to Anthropic/OpenAI. Ship v3.0 with 90 exercises (30 per provider).

## Current State
Bootcamp v2.0 is cleanly multi-provider. Adding Gemini is extension, NOT refactor:

- `provider/types.ts`: `SupportedProvider` union — add `"gemini"`, 2-line change
- `harness.ts`: switch dispatcher on `AIDEV_PROVIDER` — add `case "gemini"`, 3-line change
- `config.ts`: already has `anthropicApiKey` + `openaiApiKey` — add `geminiApiKey?` + branch in `resolveApiKey()`
- `init.ts`: add `{value:"gemini", label:"Google (Gemini)"}` + `AIza...` prefix check
- `cost.ts`: flat regex `MODEL_PRICES.families[]` — add Gemini entries
- Progress keys already `${provider}:${exerciseId}` — `gemini:01-first-generate` just works
- `exercises/`: `anthropic/` and `openai/` coexist — add `gemini/` with same structure

## Technical Findings (verified)

**SDK**: `@google/genai` v1.48.x (pin `^1.48`). NOT `@google/generative-ai` (deprecated Nov 2025). Node 20+.

**Harness patch surface** — critical difference from OpenAI:
- OpenAI: `Completions.prototype.create` returns **Promise** → patch `.then()` on the promise
- Gemini: `Models.prototype.generateContentStream` returns an **async iterable DIRECTLY** (no wrapping Promise) → must proxy the method return value without the `.then()` indirection

Prototype access: `Object.getPrototypeOf(new GoogleGenAI({ apiKey: "x" }).models)` (class not exported).

Methods to patch:
- `generateContent` (non-streaming)
- `generateContentStream` (streaming)
- `embedContent` (RAG track)

**Usage shape** (camelCase, NOT snake_case): `usageMetadata.{promptTokenCount, candidatesTokenCount, totalTokenCount, cachedContentTokenCount, thoughtsTokenCount}`.

**API key**: `AIza...` prefix. Env var: `GEMINI_API_KEY`. Config field: `geminiApiKey`.

**Default model**: `gemini-2.5-flash-lite` ($0.10 in / $0.40 out per 1M) — matches Haiku/gpt-4.1-nano cost tier.

## Track Layout (30 exercises)

| Track | Type | Notes |
|-------|------|-------|
| `01-foundations` (5) | Parallel | generateContent, model selection, token usage, streaming, structured output |
| `02-context-caching` (5) | **Gemini-unique** | Implicit auto-cache + explicit `ai.caches` API — both modes; distinguishes Gemini |
| `03-function-calling` (5) | Parallel | functionDeclarations format |
| `04-rag` (5) | Parallel | embedContent + cosine similarity |
| `05-agents` (5) | Parallel | Agentic loop with Gemini tools |
| `06-live-multimodal` (5) | **Gemini-unique** | Live API audio-to-audio realtime (WebSocket) — Gemini's killer differentiator |

## Options Considered

**Option A — All-at-once (infra + 30 exercises, one PR)** — **RECOMMENDED**
Mirrors v2.0 delivery. Single coherent PR, no half-shipped state on main. ~35 files, 7 batches. Risk: Live API harness complexity.

**Option B — Infra first, 6 incremental exercise PRs**
Smaller PRs but main has Gemini in provider list with 0 exercises between PRs. Higher coordination overhead. Not recommended.

**Option C — Defer track 06 (Live API) to v3.1**
Reduces risk but ships Gemini without its differentiator. Viable fallback if the Live API spike fails in B0.

## Recommendation

**Option A with explicit fallback to C**. The infra is well-understood — the v2.0 provider pattern was designed for exactly this extension. The one genuine unknown is the harness for `generateContentStream` (direct async iterable). This must be the first task (B0-T00: spike the prototype patch). If the Live API WebSocket intercept spike reveals complexity that would blow the PR, scope to 25 exercises (defer track 06 to v3.1) and document the defer.

## Risks

1. **`generateContentStream` prototype patch** — returns async iterable directly (not Promise-wrapped). Different interception strategy than OpenAI. **Mandatory spike before harness implementation (B0-T00).**
2. **Live API (`ai.live.connect`) harness** — WebSocket-based, not a simple Promise/iterable. May need event-emitter-level proxy. Fallback: defer to v3.1, ship 25 exercises.
3. **`@google/genai` v1.x maturity** — released Nov 2025, relatively new. Pin `^1.48`, document version in CLAUDE.md. Treat `AIza...` key validation as soft warning rather than hard exit.

## Ready for Proposal

Yes. Recommend `/sdd-propose` with Option A scope + Option C as documented fallback for track 06.
