# 04-ttl-extended — Extended 1-hour TTL

## Concept

By default, Claude's cache has a **TTL (Time To Live) of 5 minutes**. If your system prompt is used frequently but the process using it lives longer than 5 minutes (a long-lived server, a batch pipeline, an agent running for hours), you pay the cache *write* cost on every new request past the 5-minute window.

The **extended 1-hour TTL** (`ttl: "1h"`) solves this — but at a higher write cost:

| Operation | Multiplier |
|-----------|-----------|
| Cache read | 0.1× input |
| Write (5 min) | 1.25× input |
| Write (1 hour) | **2.0× input** |

To find out whether it's worth paying the 2× write cost, use `breakEvenCalls`:

```
N > write1h / (write5m - read)
N > 2.0 / (1.25 - 0.1)
N > 2.0 / 1.15 ≈ 1.74  →  Math.ceil = 2
```

Result: with just **2 reads** within the hour, the extended TTL is already cheaper.

## Docs & references

- Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Extended TTL: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#extended-cache-ttl
- Cache pricing: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#pricing

## Your task

1. Implement and export `breakEvenCalls(cacheTokens: number, pricePerMillion: number): number` using the formula `N > write1h / (write5m - read)` with `Math.ceil`.
2. In `run()`: make 2 calls using `cache_control: { type: "ephemeral", ttl: "1h" }` on the system block.
3. Return both responses.
4. Use `console.log` to print the `breakEvenCalls` result (educational value).

## How to verify

```bash
aidev verify 04-ttl-extended --solution
aidev verify 04-ttl-extended
aidev run 04-ttl-extended --solution --full
```

The tests verify:
- `breakEvenCalls` is exported as a named function.
- `breakEvenCalls(4200, 1.0)` returns a positive integer between 1 and 20.
- The result is the same for different prices (the ratio is price-invariant).
- `result.calls` has 2 elements.
- Call 1 has `cache_control` with `ttl: "1h"` on a system block.
- Call 1 shows cache activity > 0.
- Call 2 has `cache_read_input_tokens > 0`.

## Extra concept

**When to use 1h vs 5m TTL:**

```
Use 5m (default):
  - Prompts that change frequently
  - Development and testing
  - Low-frequency use of the same prompt

Use 1h:
  - Production servers with high traffic (many calls per hour)
  - Batch pipelines that run for more than 5 minutes
  - Long-lived agents (continuous RAG, chatbots with fixed system prompt)
  - Any case where the same prompt is used > 2 times within an hour
```

The `breakEvenCalls` formula is price-agnostic and token-count-agnostic — it always returns the same result because the multipliers are fixed. This makes it easy to remember: **if you're going to read the cache 2 or more times within 1 hour, use extended TTL**.
