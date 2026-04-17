# Exercise 03 — Using an explicit cache with generateContent

## Concept

In exercise 02 you created a cache and captured its name. Now you'll actually **use** it on a `generateContent` call.

The mechanism is just one field in `config`:

```ts
await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "your short question",
  config: { cachedContent: cache.name },
});
```

When the server sees `cachedContent`, it looks up the stored content, treats it as if it were prepended to your `contents`, and generates a response. You get back a normal `GenerateContentResponse` — the only observable difference is in `usageMetadata`:

- `promptTokenCount` — still reports the FULL prompt size (cached + fresh)
- `cachedContentTokenCount` — reports how many of those came from cache
- The cached tokens are **billed at the cache-read rate**, not the standard input rate

**Fresh input tokens** (what you actually paid the full rate for) = `promptTokenCount - cachedContentTokenCount`.

The architectural move this enables: keep your 50k-token knowledge base behind a cache, reference it by name, and only pay full rate for the short variable question in each request. That's how Gemini becomes cost-effective at scale for RAG-shaped workloads.

## Docs & references

1. [Explicit caching guide — using a cache](https://ai.google.dev/gemini-api/docs/caching#generate-content) — the `cachedContent` pattern
2. [`GenerationConfig.cachedContent`](https://ai.google.dev/api/generate-content#generationconfig) — field reference
3. [`CachedContent`](https://ai.google.dev/api/caching#CachedContent) — the resource you pass by name

## Your task

1. Create a cache for `longDoc` (same shape as exercise 02) — use `ttl: "120s"`.
2. Call `generateContent` with:
   - `model: "gemini-2.5-flash"` (MUST match the cache's model)
   - `contents: "Write one clear sentence about the topic of the cached document."`
   - `config: { cachedContent: cache.name, maxOutputTokens: 80 }`
3. Read `response.text` and `response.usageMetadata`.
4. Always clean up — `ai.caches.delete({ name: cache.name })` in a `finally` block.
5. Return:
   ```ts
   {
     cacheName: cache.name,
     answer: response.text,
     cachedTokens: usageMetadata.cachedContentTokenCount,
     freshInputTokens: usageMetadata.promptTokenCount - usageMetadata.cachedContentTokenCount,
   }
   ```

## How to verify

```bash
aidev verify 03-use-cached-content
```

Tests check:
- Exactly 1 `generateContent` call is made
- Request `config.cachedContent` matches `^cachedContents/...`
- `answer` is non-empty
- **`cachedTokens > 0`** — the cache was actually used (this is the whole point)
- `cachedTokens > 1000` — the stored doc was large enough to matter
- `freshInputTokens < cachedTokens` — fresh input is small, cache paid off
- Returned `cacheName` matches the request's `cachedContent`

## Extra concept (optional)

The model in your `generateContent` call **must be the same model the cache was created for**. A cache created for `gemini-2.5-flash` cannot be used on `gemini-2.5-pro`. Caches also cannot be shared across Google Cloud projects — they live with the API key that created them.

What about `systemInstruction`? If you set one when creating the cache, **do not set it again** on the generateContent call — the cached one is in effect. Overriding it is usually an error: you either get a mismatch rejection or the new instruction wins and the cache value is wasted.
