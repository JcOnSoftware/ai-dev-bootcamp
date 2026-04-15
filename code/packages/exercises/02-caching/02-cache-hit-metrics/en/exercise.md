# 02-cache-hit-metrics — Cache hit metrics

## Concept

When Anthropic's cache is active, the `usage` object in each response includes fields that let you calculate exactly how much you saved:

- `cache_read_input_tokens` → tokens read from cache (price: **0.1× input**)
- `cache_creation_input_tokens` → tokens written to cache (price: **1.25× input**)
- `input_tokens` → regular (non-cached) input tokens (price: **1.0× input**)

With these three values you can calculate the **savings percentage** by comparing the effective cost against the hypothetical cost without caching (all tokens at the regular price).

Example with Haiku ($1.00/1M input tokens):
- 5,000 tokens read from cache: $0.0005 (0.1×)
- If they were regular tokens: $0.005 (1.0×)
- Savings: 90%

## Docs & references

- Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Cache pricing: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#pricing
- Messages API reference: https://docs.claude.com/en/api/messages

## Your task

1. Implement the helper function `cacheStats(usage: CacheUsage, model: string): CacheStats` and export it by name. **The `model` parameter is required** — it lets the function work correctly with any model (Haiku, Sonnet, Opus), not just the default.
2. The function must return an object with 5 fields: `cached`, `created`, `regular`, `savings_pct`, `effective_cost_usd`.
3. Use `estimateCost(model, usage)` from `cost.ts` to calculate `effective_cost_usd` with the cache-aware formula. Pass the `model` received as parameter — never hardcode it inside `cacheStats`.
4. In `run()`: make 2 calls using `LONG_SYSTEM_PROMPT` as a cached system block, apply `cacheStats(response.usage, MODEL)` to the second call's usage, and return the result.

## How to verify

```bash
# Run against the solution:
aidev verify 02-cache-hit-metrics --solution

# Run your implementation:
aidev verify 02-cache-hit-metrics

# Inspect full output:
aidev run 02-cache-hit-metrics --solution --full
```

The tests verify:
- `cacheStats` is exported as a named function.
- With mock `{ cache_read_input_tokens: 5000, ... }`: `stats.cached === 5000`.
- `stats.savings_pct` is between 0 and 100.
- `stats.savings_pct > 50` when most tokens are cache reads.
- `stats.effective_cost_usd` is positive and finite.
- `stats.effective_cost_usd` scales with model pricing (same usage under Sonnet is more expensive than under Haiku).
- Integration: `result.calls` has 2 elements, call 2 has `cache_read_input_tokens > 0`.
- The value returned by `run()` has all 5 fields with `savings_pct > 50`.

## Extra concept

**How to use these metrics in production:**

```
savings_pct > 80% → system prompt is well-sized for the TTL
savings_pct < 20% → cache is not being leveraged; check:
  - Does the system prompt exceed the 4,096-token threshold?
  - Are calls arriving more than 5 minutes apart?
  - Does message order invalidate the cached prefix?
```

Logging `savings_pct` and `effective_cost_usd` per request lets you detect cache regressions before they impact your bill. In a high-volume system (1M calls/day), going from 0% to 80% cache savings can represent thousands of dollars per day.
