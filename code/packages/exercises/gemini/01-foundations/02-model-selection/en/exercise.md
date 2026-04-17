# Exercise 02 — Choosing the right Gemini model

## Concept

Not every task needs the most expensive model. Gemini's 2.5 family spans three cost tiers:

| Model | Input $/1M | Output $/1M | Use when |
|---|---|---|---|
| `gemini-2.5-flash-lite` | $0.10 | $0.40 | High-volume, simple tasks (classification, extraction, short answers) |
| `gemini-2.5-flash` | $0.30 | $2.50 | Balanced — default for most production uses |
| `gemini-2.5-pro` | $1.25 | $10.00 | Complex reasoning, long-context, code generation |

A good engineering habit: **start with the cheapest, escalate only when quality fails**. The way to build that habit is to run the same prompt against two tiers and compare outputs yourself. You cannot calibrate what you have not seen.

In this exercise you'll make two calls with the exact same prompt, one on `flash-lite` and one on `flash`, and return both responses side by side for inspection.

## Docs & references

1. [Gemini models list](https://ai.google.dev/gemini-api/docs/models) — all 2.5 variants, capabilities, context windows
2. [Gemini API pricing](https://ai.google.dev/pricing) — live per-1M-token input/output rates
3. [`@google/genai` SDK README](https://github.com/googleapis/js-genai) — client usage

## Your task

1. Instantiate `GoogleGenAI` with the API key.
2. Define a single prompt — e.g. `"Explain what an API is in one sentence."`
3. Make TWO `generateContent` calls with `config.maxOutputTokens: 128`:
   - One with `model: "gemini-2.5-flash-lite"`
   - One with `model: "gemini-2.5-flash"`
4. Return both responses as `{ flashLite, flash }`.

## How to verify

```bash
aidev verify 02-model-selection
```

Tests check:
- Exactly 2 API calls are made
- Both models appear (not the same model twice)
- Both calls use the same prompt (so the comparison is apples-to-apples)
- Both responses have candidates with text
- Both responses report token usage
- Return value has `flashLite` and `flash` properties

## Extra concept (optional)

After `aidev verify` passes, try:

```bash
aidev run 02-model-selection --solution --full
```

You'll see the two responses in full plus total token usage and cost. In many cases `flash-lite` and `flash` produce nearly identical short answers — that's when you SHOULD be running flash-lite in production. When the quality gap is obvious, you have evidence for escalating.
