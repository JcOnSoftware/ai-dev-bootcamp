# Exercise 05 — Measuring cache cost savings

## Concept

You've built up to this: the whole point of explicit caching is **cost at scale**. You've seen how to create a cache (02), use it (03), and keep it alive (04). Now you quantify what it's actually saving.

For `gemini-2.5-flash` (paid tier, 2026-04):

| Token type | Rate (per 1M tokens) |
|---|---|
| Standard input | **$0.30** |
| Cache read | **$0.075** (25% of input — so 75% discount) |
| Output | $2.50 |

For a single call the formula is:

- **Without cache**: `(cachedTokens + freshInputTokens) × $0.30/M + outputTokens × $2.50/M`
- **With cache**: `cachedTokens × $0.075/M + freshInputTokens × $0.30/M + outputTokens × $2.50/M`

Per-call savings are small — usually fractions of a cent — because a bootcamp-sized cache is only ~5k tokens. But if you multiply by 100k calls a day (a busy support chatbot, an indexing pipeline, an analytics agent), the savings become real money. That's what you're going to measure here.

## Docs & references

1. [Gemini pricing page](https://ai.google.dev/pricing) — up-to-date input / cache-read / output rates per model
2. [Explicit caching guide](https://ai.google.dev/gemini-api/docs/caching#explicit-caching) — when caching is worth the storage cost
3. [`UsageMetadata`](https://ai.google.dev/api/generate-content#UsageMetadata) — `cachedContentTokenCount`, `promptTokenCount`, `candidatesTokenCount`

## Your task

1. Create a cache for `longDoc` with `ttl: "120s"`, same shape as exercise 03.
2. Run THREE different questions against that cache:
   - `"Summarize the document in one sentence."`
   - `"Pick one section number the document mentions."`
   - `"What animal is the document about?"`
   Use `config.maxOutputTokens: 80` each time.
3. For each response, extract from `usageMetadata`:
   - `cachedTokens = cachedContentTokenCount`
   - `freshInputTokens = promptTokenCount - cachedContentTokenCount`
   - `outputTokens = candidatesTokenCount`
4. Compute per-call `costWithCacheUSD` and `costWithoutCacheUSD` using the rates above.
5. Sum totals across the 3 calls, compute `savingsUSD` and `savingsPercent`.
6. Delete the cache in a `finally` block.
7. Return the full `SavingsReport`.

## How to verify

```bash
aidev verify 05-cache-cost-savings
```

Tests check:
- Exactly 3 `generateContent` calls, all referencing `config.cachedContent`
- Return has 3 per-call breakdowns
- Every call has `cachedTokens > 0` — cache actually used
- Every call has `costWithCacheUSD < costWithoutCacheUSD`
- `totalWithCacheUSD` and `totalWithoutCacheUSD` equal the per-call sums (within float tolerance)
- `savingsUSD === totalWithoutCacheUSD - totalWithCacheUSD` and is positive
- `savingsPercent` is a positive number under 100

## Extra concept (optional)

A per-call savings number is misleading in isolation — the right way to evaluate caching is **break-even analysis**. Cache storage also has a cost (currently ~$1.00 per 1M tokens stored per hour on paid tier). If your cache lives for an hour and is only hit 5 times on a 5k-token doc, storage costs might exceed the read savings — you'd have been better off without the cache.

The rule of thumb: cache pays off if `(reads-per-hour × cache-read-savings-per-read) > storage-cost-per-hour`. Track that ratio in production dashboards. When traffic drops, it's often correct to shorten TTLs or delete caches. Blind caching is how you lose money while thinking you're saving it.
