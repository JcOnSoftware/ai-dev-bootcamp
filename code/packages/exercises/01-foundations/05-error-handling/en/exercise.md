# Exercise 05 — Error handling: retry with exponential backoff

## Concept

In local development, calls to Claude work every time. In production, **they fail often**, and if you don't handle errors your app is fragile. Typical failure modes:

| Status | Error (SDK class)           | Retryable? | What to do |
|--------|-----------------------------|------------|------------|
| 400    | `BadRequestError`           | No         | Your request is malformed — fix your code. |
| 401    | `AuthenticationError`       | No         | Invalid API key — fix the secret. |
| 403    | `PermissionDeniedError`     | No         | Your org can't access that model. |
| 404    | `NotFoundError`             | No         | Wrong model ID. |
| **429**| **`RateLimitError`**        | **YES**    | You hit rate limits — wait and retry. |
| 500-599| `InternalServerError`       | YES        | Anthropic-side issue — retry. |
| —      | `APIConnectionError`        | YES        | Network broken (DNS, timeout, socket) — retry. |
| —      | `APIConnectionTimeoutError` | YES        | Request exceeded timeout — retry. |

**The rule**: retryable = the error may resolve itself if you wait. Fatal = your code is broken, retrying won't help.

**Exponential backoff** — the standard retry pattern:

```
attempt 0 → error 429 → wait 500ms  → retry
attempt 1 → error 429 → wait 1000ms → retry
attempt 2 → error 429 → wait 2000ms → retry
attempt 3 → error 429 → throw (you give up)
```

Each retry doubles the delay (`baseDelayMs * 2^attempt`). Reason: if the server is overloaded, waiting LONGER gives it more time to recover. If all your clients retry IMMEDIATELY after a 429, you make things worse — that's called *thundering herd*.

**Jitter** (optional, bonus) — add randomness to the delay so multiple clients don't retry in sync. Available in the solution as an opt-in flag (see "Extra concept" below).

## Docs & references

1. **SDK README — Error handling section** — official list of error classes and how they're thrown:
   → https://github.com/anthropics/anthropic-sdk-typescript#handling-errors
2. **Messages API reference — errors** — status codes and messages:
   → https://platform.claude.com/docs/en/api/messages
3. **Rate limits** — account quotas and how to avoid them:
   → https://platform.claude.com/docs/en/api/rate-limits

> Tip: SDK error classes (`RateLimitError`, `AuthenticationError`, etc.) are exported from `@anthropic-ai/sdk` and also as static fields on `Anthropic` (e.g. `Anthropic.RateLimitError`). All extend `APIError` which has a `.status` field with the HTTP code.

## Your task

Open `starter.ts`. You'll write TWO things:

### 1) `withRetry<T>(fn, options?)` — exported helper

A generic function that:
- Runs `fn()`.
- If it fails with a **retryable** error, waits `baseDelayMs * 2^attempt` ms and retries, up to `maxAttempts` total attempts.
- If it fails with a **fatal** error, re-throws immediately (no retry).
- If it runs out of attempts, re-throws the last error.

"Retryable" classification (keep it simple):
- `err.status === 429` → retryable
- `typeof err.status === "number" && err.status >= 500 && err.status < 600` → retryable
- `err.name === "APIConnectionError" || err.name === "APIConnectionTimeoutError"` → retryable
- Anything else → **not** retryable

Reasonable defaults: `maxAttempts: 3`, `baseDelayMs: 500`.

### 2) `run()` — the real call

Use `withRetry` to wrap a Haiku call (brief greeting like exercise 01). That way, if the exercise runs on a flaky network or hits rate limits, it recovers on its own.

Return the resulting `Message` directly.

## How to verify

```bash
# From code/:
aidev verify 05-error-handling

# Playground:
aidev run 05-error-handling --solution
```

Tests check TWO things:

**Unit tests for `withRetry`** (no API, fake errors):
- If `fn` doesn't throw, `withRetry` calls it once and returns.
- If `fn` throws a `status: 429` error then succeeds, `withRetry` retries and returns the success.
- If `fn` throws a `status: 500` error, it also retries.
- If `fn` throws a `status: 401` (auth) error, `withRetry` does NOT retry — re-throws right away.
- If `fn` throws 429 on ALL attempts, `withRetry` re-throws after `maxAttempts`.
- Delay between retries grows exponentially (approximate check via measured time).

**Integration test for `run`** (one real API call):
- `run` returns a `Message` with text content.
- Harness capture shows Haiku was used.

## Extra concept (optional)

1. **Jitter** — already available in the solution as an opt-in flag:

   ```ts
   // Extended signature
   interface RetryOptions {
     maxAttempts?: number;
     baseDelayMs?: number;
     jitter?: boolean; // default false
   }

   // Usage
   await withRetry(() => client.messages.create(...), { jitter: true });
   ```

   Implementation: `delay = baseDelayMs * 2^attempt + Math.random() * baseDelayMs`.

   **Why it matters**: if 100 clients hit a 429 at the same time and all use deterministic backoff, they retry in the same millisecond — a synchronized burst that overloads the server again (thundering herd). With jitter, each client waits a slightly different amount and retries spread out.

   The flag is opt-in (default `false`) to keep the exercise's deterministic timing tests stable. In real production, **always turn it on**.
2. **Observability**: log each retry with attempt count + last error. In production you want to know HOW MANY times the system had to retry — it's a health metric.
3. **Global deadline**: besides `maxAttempts`, a `maxTotalDelayMs` that cuts off when accumulated time exceeds X. UX-wise: a user waiting 30 seconds in a chat already left.

You'll recognize these patterns in libraries like `p-retry`, `async-retry`, or AWS SDK's retry. You know the recipe — now you know the variables.
