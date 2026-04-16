# Exercise 01 — Context window limits and truncation

## Concept

LLMs have a **context window limit** — a maximum number of tokens they can process in a single call, combining both input (messages) and output (response). When the model hits the output token limit, it simply stops mid-sentence. There's no error — the `finish_reason` field tells you what happened.

Possible values for `finish_reason`:
- `"stop"` — the model finished naturally (most common)
- `"length"` — cut off because it reached `max_completion_tokens`
- `"content_filter"` — stopped by safety filters
- `"tool_calls"` — the model wants to call a function

With `max_completion_tokens: 50`, any long response gets truncated. You can use this to:
1. **Control costs**: cap the maximum response so you don't pay for extra tokens
2. **Detect truncation**: if `finish_reason === "length"`, you know the response is incomplete

```typescript
const finishReason = response.choices[0].finish_reason;
// → "length" if truncated, "stop" if it finished naturally
```

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — `max_completion_tokens` and `finish_reason` parameters

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client and call `client.chat.completions.create` with:
   - `model: "gpt-4.1-nano"`
   - `max_completion_tokens: 50` — intentionally small to force truncation
   - A user message: `"Write a detailed essay about the history of computing."`
3. Read `response.choices[0].finish_reason`.
4. Compute `wasTruncated = (finishReason === "length")`.
5. Return `{ response, finishReason, wasTruncated }`.

## How to verify

```bash
aidev verify 01-context-window-limits
```

Tests check:
- Exactly 1 API call is made
- The request uses `gpt-4.1-nano`
- `max_completion_tokens` is `50`
- `finishReason` is `"length"`
- `wasTruncated` is `true`
- `completion_tokens` is at most `50`

## Extra concept (optional)

In real applications, when you detect `finish_reason === "length"`, you have several options:

1. **Retry with more tokens**: increase `max_completion_tokens` and ask it to continue from where it left off
2. **Ask for a shorter summary**: rephrase the prompt to request a more concise response
3. **Process in chunks**: split the task into smaller pieces

You can also use `max_completion_tokens` as a **safety guard** in production — even if the prompt asks for a short response, always set a reasonable high cap to avoid runaway responses and unexpected costs.
