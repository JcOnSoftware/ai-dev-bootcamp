# Exercise 02 — Creating an explicit context cache

## Concept

Exercise 01 covered **implicit** caching — automatic, free, based on shared prefixes. It has two limits:

1. **Cache lifetime you do not control** — Google may evict your prefix at any time.
2. **Works only for the SAME user / SAME project / SAME model** — you can't broadcast a shared knowledge base to many clients.

For either problem, you reach for **explicit caching**: you ask Gemini to store specific content under a named handle. You get back a `cachedContents/<id>` name. From then on, any `generateContent` call that references that name via `config.cachedContent` will use the stored content without reprocessing it.

You pay two things for explicit caching:

- **A reduced per-token rate** on cache reads (much cheaper than standard input).
- **A storage fee per token, per hour** for as long as the cache lives (so set a sensible `ttl` and delete when done).

Explicit caching requires a **billing-enabled Gemini key** — free tier has `TotalCachedContentStorageTokensPerModelFreeTier: limit=0` and will 429.

This exercise focuses ONLY on **creating** a cache and reading back its metadata. Exercise 03 covers using the cache for generation.

## Docs & references

1. [Explicit caching guide](https://ai.google.dev/gemini-api/docs/caching#explicit-caching) — `ai.caches.create` shape + lifecycle
2. [`CachedContent` resource](https://ai.google.dev/api/caching#CachedContent) — fields returned (`name`, `displayName`, `expireTime`, `usageMetadata`)
3. [`caches.create` method](https://ai.google.dev/api/caching#method:-cachedcontents.create) — parameters and defaults

## Your task

1. Instantiate `GoogleGenAI` with your API key.
2. Call `ai.caches.create({ ... })` with:
   - `model: "gemini-2.5-flash"`
   - `config.contents`: a single user message with the `longDoc` constant from `starter.ts`
   - `config.systemInstruction`: `"You answer based only on the provided document."`
   - `config.ttl`: `"300s"` (5 minutes)
   - `config.displayName`: `"amazon-doc-cache"` — a human-readable tag
3. After creation, capture:
   - `cache.name` — the resource name (looks like `cachedContents/abc123...`)
   - `cache.model` — the fully-qualified model name
   - `cache.displayName` — your tag
   - `cache.expireTime` — as a boolean `hasExpireTime` (`true` if it's present and non-empty)
   - `cache.usageMetadata.totalTokenCount` — how many tokens were stored
4. **Delete the cache immediately** with `ai.caches.delete({ name: cache.name })`. Caches cost storage-per-hour, and this exercise does not need it to live.
5. Return `{ name, model, displayName, hasExpireTime, tokensCached }`.

## How to verify

```bash
aidev verify 02-create-explicit-cache
```

Tests check:
- No `generateContent` calls were made (this exercise is about caches only)
- `name` matches `^cachedContents/...`
- `model` contains `gemini-`
- `displayName === "amazon-doc-cache"`
- `hasExpireTime === true`
- `tokensCached > 1000` (the stored doc is large enough to be useful)

## Extra concept (optional)

In a real application the cache is usually created **once at deploy time** (e.g. a warm-up script on service startup that caches the policy doc or codebase index) and referenced by every request for the TTL window. When the TTL is about to expire, a background job calls `ai.caches.update({ name, ttl: "..." })` to extend it — that's cheaper than creating a new cache from scratch because the content is already on Google's side.

You can list active caches with `ai.caches.list()` and inspect them with `ai.caches.get({ name })`. Good discipline: add a `displayName` so your dashboard shows meaningful labels instead of opaque IDs.
