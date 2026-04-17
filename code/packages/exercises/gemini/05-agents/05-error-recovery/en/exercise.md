# Exercise 05 — Let the agent recover from a tool failure

## Concept

Tools fail. Networks time out, rate limits hit, inputs malform. When a tool fails in the middle of an agent loop, you have three options:

1. **Throw** — let the exception propagate. The whole agent turn fails, and the user sees a stack trace. Usually wrong.
2. **Silent fallback** — substitute a generic "no data" result. The model doesn't know anything went wrong and might confidently invent an answer. Usually very wrong.
3. **Surface the error in the `functionResponse`** and let the model see it. The model reads `{ error: "...", message: "..." }` and decides what to do next: retry, try a different tool, or tell the user. Usually right.

Option 3 is idiomatic. It works because Gemini reads the function response shape intelligently — if you return `{ error, message }`, the model treats it as a failure signal and often decides on its own to retry, adjust args, or explain the failure.

You can nudge this with a **description hint**: `"... if the lookup returns an error object, retry once with the same key."` That's the trick this exercise uses.

## Docs & references

1. [Function calling guide](https://ai.google.dev/gemini-api/docs/function-calling) — including error-handling conventions
2. [`FunctionResponse` shape](https://ai.google.dev/api/caching#FunctionResponse) — `response` is a free-form object, use any shape you like
3. [Prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) — how descriptions steer model behavior

## Your task

1. `unreliableLookup` in `starter.ts` is deterministic: call #1 returns an error shape, call #2+ returns real data.
2. Declare a `lookup(key)` tool with a description that explicitly mentions the retry-on-error contract.
3. Build the standard agent loop. User prompt: `"Look up 'user_profile' and tell me whether you got the data."`
4. Route calls to `unreliableLookup`, then append the returned object as `response` in the `functionResponse` part.
5. Call `resetCallCount()` at the start. After the loop, read `getCallCount()`.
6. Return `{ lookupCallCount, toolCalls, answer }`.

## How to verify

```bash
aidev verify 05-error-recovery
```

Tests check:
- At least 3 `generateContent` calls (first → retry → final answer)
- **`lookupCallCount >= 2`** — the model actually retried after the error
- Every tool call was `lookup`
- Turn 2's contents include a `functionResponse` with `response.error === "timeout"` (the error was surfaced to the model)
- Final answer acknowledges success (mentions data, retry, or the key)

## Extra concept (optional)

Production agents need **bounded retries**. The model might loop forever calling the same failing tool. Patterns:

- **MAX_TURNS** caps absolute loop length (you've had this since exercise 01).
- **Tool-level retry counter**: track `lookupCallCount` yourself and refuse to forward retries after N attempts. Return `{ error: "retries_exhausted", ... }` so the model is forced to move on.
- **Backoff**: insert `await sleep(2000)` between retries of the SAME tool call with SAME args to avoid hammering an upstream.

A tool that always returns `{ error, message }` but the model keeps calling it is a classic stuck-loop symptom. Defense in depth: agent should give up after retries, tool harness should rate-limit per (tool_name, args_hash), and MAX_TURNS is the final backstop.
