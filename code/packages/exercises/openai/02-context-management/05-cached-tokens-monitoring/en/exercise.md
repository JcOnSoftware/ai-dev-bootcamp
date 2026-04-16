# Exercise 05 — Prompt caching and cached token monitoring

## Concept

OpenAI has **automatic prompt caching**: when a prompt prefix exceeds 1024 tokens and you reuse it across multiple requests, the cached tokens are charged at half price (or free on some models). This is especially useful when you have a long system prompt that repeats on every request.

The key is that the **exact prefix must be identical** — if you change the system prompt by even a single character, the cache doesn't apply. The field `usage.prompt_tokens_details.cached_tokens` tells you how many tokens came from cache on that request:

```typescript
// Access the field (may need a cast since it's not in the official types yet)
const cachedTokens =
  (response.usage as any)?.prompt_tokens_details?.cached_tokens ?? 0;
```

On the first request, `cached_tokens` is usually 0 (the cache is "warming up"). On the second request with the same long prefix, you may see `cached_tokens > 0`.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — `usage.prompt_tokens_details` field
3. [Prompt Caching guide](https://platform.openai.com/docs/guides/prompt-caching) — how auto-caching works in OpenAI

## Your task

1. Open `starter.ts`. It already defines `LONG_SYSTEM_PROMPT` — a system prompt of ~1200 tokens. Do not modify it.
2. Create an OpenAI client.
3. **First call**: use `LONG_SYSTEM_PROMPT` as the system message with `{ role: "user", content: "What is your primary role?" }`.
4. **Second call**: use the SAME `LONG_SYSTEM_PROMPT` as the system message with `{ role: "user", content: "Summarize your expertise in one sentence." }`.
5. For each response, read `cached_tokens`:
   ```typescript
   (response.usage as any)?.prompt_tokens_details?.cached_tokens ?? 0
   ```
6. Return `{ call1CachedTokens, call2CachedTokens, cacheImproved: call2CachedTokens > call1CachedTokens }`.

Use `model: "gpt-4.1-nano"` and `max_completion_tokens: 32` for both calls.

## How to verify

```bash
aidev verify 05-cached-tokens-monitoring
```

Tests check:
- Exactly 2 API calls
- Both use `gpt-4.1-nano`
- Both use the same system prompt (identical prefix)
- `call1CachedTokens` is a number >= 0
- `call2CachedTokens` is a number >= 0
- `cacheImproved` is a boolean

Tests do **NOT** assert `cacheImproved === true` — caching is automatic and may not always trigger in test environments.

## Extra concept (optional)

To maximize cache savings in production:

1. **Put static content first**: the system prompt and any fixed text should go at the beginning of the messages array. Dynamic content (the user's question) goes at the end.
2. **Use the same object/constant**: if the string comes from the same immutable variable, the prefix is guaranteed to be identical.
3. **Monitor it in production**: log `cached_tokens` to know your actual hit rate. In systems with frequent calls to the same system prompt, you can see 50-80% reduction in input token cost.

OpenAI's cache expires after ~5-10 minutes of inactivity. For batch or low-frequency workloads, the benefit is smaller. For chatbots with many concurrent users, the impact is very significant.
