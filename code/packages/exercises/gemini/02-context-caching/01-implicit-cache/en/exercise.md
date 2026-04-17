# Exercise 01 — Implicit context caching

## Concept

A common pattern in production: you send a **long stable prefix** (a system instruction, a set of reference docs, a codebase summary) plus a **short variable question** on every request. The prefix is the same across many users or many turns; only the question changes.

Gemini's **implicit caching** detects this automatically. When two requests share a long-enough identical prefix, the second request reads the prefix from cache instead of being reprocessed — and Google reports how many tokens were served from cache in `usageMetadata.cachedContentTokenCount`. You pay a **reduced rate** on those cached tokens and save on latency.

Two rules for implicit caching to work:

1. **The prefix must be large enough** (~1024+ tokens for `gemini-2.5-flash`; pricing pages have the minimum for each model).
2. **The prefix must be BYTE-IDENTICAL** across requests. Changing one character at the start invalidates the whole cache. Put variable content at the END, stable content at the START.

No cache API, no cleanup, no cost to enable. You just... structure your prompts well.

## Docs & references

1. [Context caching overview](https://ai.google.dev/gemini-api/docs/caching) — implicit vs explicit, when each applies
2. [Implicit caching notes](https://ai.google.dev/gemini-api/docs/caching#implicit-caching) — prefix rules, minimum sizes, discount rates
3. [`UsageMetadata.cachedContentTokenCount`](https://ai.google.dev/api/generate-content#UsageMetadata) — where the cache hit shows up

## Your task

1. The `longDoc` constant in `starter.ts` is a ~4000-character prefix (enough to clear the minimum token threshold). You can reuse it as-is.
2. Write a helper that makes a `generateContent` call where:
   - `model`: `"gemini-2.5-flash"`
   - `contents`: `` `${longDoc}\n\nQuestion: ${question}` `` (prefix first, question last)
   - `config.maxOutputTokens`: `64`
3. Call the helper TWICE with different questions — for example:
   - `"How many countries does the Amazon span?"`
   - `"Name one challenge facing the Amazon region."`
4. Extract `response.usageMetadata` from each call.
5. Return `{ firstUsage, secondUsage }` so you (and the tests) can see the difference.

## How to verify

```bash
aidev verify 01-implicit-cache
```

Tests check:
- Exactly 2 API calls are made
- Both calls share the same byte-identical prefix (the part before `Question:`)
- Both calls receive valid candidates
- Both `usageMetadata` values have `promptTokenCount` and it's > 1000
- **The second call's `cachedContentTokenCount` is greater than 0** — implicit caching activated

## Extra concept (optional)

Implicit caching is a latent architectural assumption that good API users learn early: **order your content from stable → variable**. If your real system has a 3000-token system prompt, a 2000-token policy doc, and a 50-token user question, put them IN THAT ORDER. Swap the order and you'll pay full price on every turn plus waste a few hundred milliseconds per call.

The next exercises cover **explicit** caching — where you create a named cache with `ai.caches.create()`, get back a cache reference, and explicitly point future calls at it. Explicit caching gives you more control (long TTLs, sharing across projects, larger discounts) at the cost of managing cache lifetime yourself.
