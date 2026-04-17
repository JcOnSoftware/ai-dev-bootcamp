# Exercise 01 — Thinking tokens and thinkingBudget

## Concept

Gemini 2.5 models can generate **reasoning tokens** internally before emitting the visible answer. Think of it as scratch-paper work that the model does but doesn't show. It improves quality on multi-step math, logic, and code-generation tasks — at the cost of extra (invisible) output tokens.

The control surface is `config.thinkingConfig.thinkingBudget`:

| Value | Meaning |
|---|---|
| `0` | Thinking OFF — fastest, cheapest, but may miss hard problems |
| `-1` | Dynamic — model decides how much to think per request |
| `1..24576` | Fixed budget (2.5-flash default: 8192) |

When thinking is on, `response.usageMetadata.thoughtsTokenCount` reports how many tokens were "spent" internally. **Thinking tokens are billed at the output rate** — include them in cost estimates.

In this exercise you solve a multi-step word problem where thinking meaningfully helps, and inspect the usage breakdown to see thinking vs visible output.

## Docs & references

1. [Thinking guide](https://ai.google.dev/gemini-api/docs/thinking) — when thinking helps, budget semantics, cost math
2. [`ThinkingConfig`](https://ai.google.dev/api/generate-content#ThinkingConfig) — field reference
3. [`UsageMetadata.thoughtsTokenCount`](https://ai.google.dev/api/generate-content#UsageMetadata) — where to read thinking usage

## Your task

1. Call `generateContent` with:
   - `model`: `"gemini-2.5-flash"` (thinking is supported on 2.5+)
   - `contents`: a multi-step word problem that benefits from reasoning (the starter includes one about trains meeting)
   - `config.thinkingConfig.thinkingBudget`: `1024`
   - `config.maxOutputTokens`: `400`
2. Read `response.usageMetadata`. Extract:
   - `thoughtsTokenCount`
   - `candidatesTokenCount`
3. Return `{ thoughtsTokenCount, candidatesTokenCount, answer: response.text }`.

## How to verify

```bash
aidev verify 01-thinking-budget
```

Tests check:
- Exactly 1 `generateContent` call
- Request `config.thinkingConfig.thinkingBudget` is a positive number
- Model is `gemini-2.5-*`
- Return has all three fields in the right types
- **`thoughtsTokenCount > 0`** — thinking was actually used
- `candidatesTokenCount > 0` and `answer` is non-empty

## Extra concept (optional)

A trap: people see that `candidatesTokenCount + promptTokenCount < totalTokenCount` and assume they're being double-billed. They aren't — the gap is `thoughtsTokenCount`. Your cost model must account for thinking or it'll silently under-count.

When is thinking worth it? Rough rule:
- **Yes**: math reasoning, multi-step code, hypothesis generation, rule-based decisions.
- **No**: simple summarization, keyword extraction, classification, formatting tasks.

Start with `thinkingBudget: -1` (dynamic) in development and inspect `thoughtsTokenCount`. If it's consistently high for tasks where you don't need it, explicitly cap or disable thinking for those prompts.

In agent loops, thinking in the planner step (e.g., exercise 03 of track 05) is often worth it; in leaf tool-call turns it's usually waste.
