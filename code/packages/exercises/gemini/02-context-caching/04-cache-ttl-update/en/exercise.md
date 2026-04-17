# Exercise 04 — Updating a cache's TTL

## Concept

An explicit cache lives for its TTL (time-to-live) and then expires. If you're building a service that refers to a cache across many requests, a single 5-minute cache isn't useful — you'll re-create it constantly.

The idiomatic pattern: **create the cache once, extend its TTL periodically**. Extending is cheaper than re-creating because the content stays on Google's side; only the expiration clock moves.

The API for that is `ai.caches.update()`:

```ts
const updated = await ai.caches.update({
  name: cache.name,
  config: { ttl: "600s" },
});
// updated.expireTime is now ~10 minutes from "now"
```

The `ttl` string is **relative to the time of the update call**, not cumulative. Sending `ttl: "600s"` means "expire 600 seconds from now", wiping whatever was scheduled before.

In production you typically run a background job that watches `expireTime` and calls `update` when it gets within ~30s of expiry. That keeps the cache "always warm" for as long as it's useful, without paying storage for the tail.

## Docs & references

1. [`caches.update` reference](https://ai.google.dev/api/caching#method:-cachedcontents.patch) — accepted fields and semantics
2. [Explicit caching lifecycle](https://ai.google.dev/gemini-api/docs/caching#explicit-caching) — create / update / get / delete
3. [`CachedContent.expireTime`](https://ai.google.dev/api/caching#CachedContent) — format (ISO-8601 string from Google)

## Your task

1. Create a cache with the same shape as exercise 02, but `ttl: "60s"` — short initial lifetime.
2. Save `cache.expireTime` as `initialExpireTime`.
3. Call `ai.caches.update({ name: cache.name, config: { ttl: "600s" } })`. Save `updated.expireTime` as `updatedExpireTime`.
4. Compute `extendedBySeconds` by parsing both ISO strings with `new Date()` and subtracting:
   ```ts
   Math.round(
     (new Date(updatedExpireTime).getTime() - new Date(initialExpireTime).getTime()) / 1000
   )
   ```
5. Delete the cache in a `finally` block.
6. Return `{ cacheName, initialExpireTime, updatedExpireTime, extendedBySeconds }`.

## How to verify

```bash
aidev verify 04-cache-ttl-update
```

Tests check:
- No `generateContent` calls (this is purely about cache lifecycle)
- `cacheName` matches `^cachedContents/...`
- Both expire-time strings parse via `new Date()`
- `updatedExpireTime > initialExpireTime`
- `extendedBySeconds` is between 400 and 700 (roughly the 540s delta between 600s and 60s, allowing clock skew + RTT)

## Extra concept (optional)

`caches.update` accepts **only `ttl` and `expireTime`** — you cannot change the cached content itself. If your data changed, the only way to reflect that is to create a new cache and swap your app's `cacheName` reference.

If you need ongoing updates to the content, consider using implicit caching instead (exercise 01): your prompt changes, but as long as the PREFIX stays stable, you still get cache benefits without managing a handle.

For multi-tenant services, `displayName` is the field to rely on — use a convention like `<tenant-id>:<doc-hash>` so you can filter `ai.caches.list()` results and expire per-tenant caches when a tenant updates their source doc.
