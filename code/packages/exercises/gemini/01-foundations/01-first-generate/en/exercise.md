# Exercise 01 — Your first Gemini generation

## Concept

Gemini's API is organized around **`generateContent`** — you send `contents` (a string or a structured array) and receive a response with `candidates`, `usageMetadata`, and `modelVersion`. The shape differs from OpenAI's `choices` or Anthropic's `content` blocks: Gemini returns candidates whose `content.parts[]` each have a `text` field.

The Node.js SDK (`@google/genai`) is the current package — NOT `@google/generative-ai` (deprecated Nov 2025). You instantiate `new GoogleGenAI({ apiKey })` and call `ai.models.generateContent({ model, contents, config })`.

The cheapest model is `gemini-2.5-flash-lite` ($0.10 input / $0.40 output per 1M tokens) — matches the cost tier of Haiku and gpt-4.1-nano. Each call in this exercise costs fractions of a cent.

## Docs & references

1. [`@google/genai` SDK README](https://github.com/googleapis/js-genai) — installation and client setup
2. [`generateContent` API reference](https://ai.google.dev/api/generate-content) — full request/response schema
3. [Models list](https://ai.google.dev/gemini-api/docs/models) — available Gemini models and pricing tiers

## Your task

1. Open `starter.ts` and create a `GoogleGenAI` client. Pass `{ apiKey: process.env.GEMINI_API_KEY }`.
2. Call `ai.models.generateContent()` with:
   - `model`: `"gemini-2.5-flash-lite"` (cheapest tier)
   - `contents`: a short prompt string (e.g. `"Say hello briefly in Spanish, one short sentence."`)
   - `config`: `{ maxOutputTokens: 128 }` to keep the response short
3. Return the full response (the `GenerateContentResponse` object).

## How to verify

```bash
aidev verify 01-first-generate
```

Tests check:
- Exactly 1 API call is made
- The non-streaming `generateContent` method is used (not streaming)
- A Gemini model is used
- A non-empty `contents` value is passed
- The response has at least one candidate with text parts
- `usageMetadata` reports `promptTokenCount` and `candidatesTokenCount`

## Extra concept (optional)

Gemini's response shape has a few subtleties worth knowing:

- **`response.text`** is a convenience getter on the SDK response object — it concatenates the `text` fields of `candidates[0].content.parts[]`. Useful for quick prints, but the structural source of truth is `candidates[...].content.parts[...].text`.
- **`finishReason`** on each candidate tells you why generation stopped: `"STOP"`, `"MAX_TOKENS"`, `"SAFETY"`, etc. Unlike OpenAI, Gemini uses SCREAMING_CASE.
- **Thinking models** (`gemini-2.5-pro`) may include a `thoughtsTokenCount` in `usageMetadata` — those tokens are billed as output.
