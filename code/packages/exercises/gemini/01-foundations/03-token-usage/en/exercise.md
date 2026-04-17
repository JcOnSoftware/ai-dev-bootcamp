# Exercise 03 — Reading token usage and estimating cost

## Concept

Every Gemini response includes a `usageMetadata` object so you can track tokens consumed. Unlike OpenAI (`prompt_tokens` / `completion_tokens` — snake_case) or Anthropic (`input_tokens` / `output_tokens`), Gemini uses camelCase:

- `promptTokenCount` — input tokens (your prompt + system instructions + cached content + files)
- `candidatesTokenCount` — output tokens across all candidates
- `totalTokenCount` — the provider's total, usually `prompt + candidates`
- `cachedContentTokenCount` — portion of input served from cache (free on implicit caching, discounted on explicit)
- `thoughtsTokenCount` — "thinking" tokens for `gemini-2.5-pro` (billed as output)

Cost discipline means you track this PER CALL, not as a monthly surprise on the bill. In this exercise you'll read those fields and compute a cost estimate using the current `gemini-2.5-flash-lite` rates.

## Docs & references

1. [`UsageMetadata` in the generate-content reference](https://ai.google.dev/api/generate-content#UsageMetadata) — all fields and their meaning
2. [Gemini API pricing](https://ai.google.dev/pricing) — current per-1M-token rates by model
3. [`@google/genai` SDK README](https://github.com/googleapis/js-genai) — client usage

## Your task

1. Make one `generateContent` call with `model: "gemini-2.5-flash-lite"` and a prompt long enough to produce visible token counts (e.g., `"Summarize the plot of Romeo and Juliet in 3 sentences."`). Set `config.maxOutputTokens: 256`.
2. Read `response.usageMetadata`. Extract:
   - `inputTokens` from `promptTokenCount`
   - `outputTokens` from `candidatesTokenCount`
   - `totalTokens` from `totalTokenCount`
3. Compute `estimatedCostUSD` using flash-lite rates:
   - input:  `$0.10` per 1M tokens
   - output: `$0.40` per 1M tokens
4. Return `{ inputTokens, outputTokens, totalTokens, estimatedCostUSD }`.

## How to verify

```bash
aidev verify 03-token-usage
```

Tests check:
- Exactly 1 API call is made
- Return object has all four numeric fields
- `inputTokens` and `outputTokens` are positive
- `totalTokens` ≈ `inputTokens + outputTokens` (small tolerance for thinking tokens)
- `estimatedCostUSD` is a small positive number (< $0.01)
- `estimatedCostUSD` matches the flash-lite formula exactly

## Extra concept (optional)

The `cost.ts` module in this repo already knows Gemini's pricing and exposes `normalizeGeminiUsage()` + `estimateCost()`. In a real CLI that logs per-run cost you'd call those instead of re-deriving prices. This exercise does it manually so you understand where the number comes from — black-boxing cost estimation is how teams end up surprised by a $3k bill at the end of the month.

When you use `gemini-2.5-pro` with thinking enabled, `thoughtsTokenCount` appears in `usageMetadata`. Those tokens **are billed as output**, so your "output price × candidatesTokenCount" alone will under-count. Use `totalTokenCount - promptTokenCount` (or sum `candidates + thoughts`) for an accurate output figure on that model.
