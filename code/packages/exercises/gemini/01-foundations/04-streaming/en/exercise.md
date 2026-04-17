# Exercise 04 — Streaming responses with generateContentStream

## Concept

Non-streaming calls block until the model finishes the entire response. For chat UIs, code assistants, or anything interactive, you want tokens to appear as they arrive — that's **streaming**.

Gemini's streaming method is `ai.models.generateContentStream({ ... })`. It returns a `Promise<AsyncGenerator<GenerateContentResponse>>` — unlike OpenAI's stream (a Promise resolving to a `Stream` object with `[Symbol.asyncIterator]`), Gemini's returned value IS the async iterable once awaited.

Iterating with `for await` gives you one `GenerateContentResponse`-shaped chunk per step. Each chunk has a `.text` convenience getter for the incremental text — accumulate those into your final string. The chunk count depends on the model and response length; sometimes Gemini batches the whole answer into a single chunk, sometimes it splits into many.

## Docs & references

1. [Streaming text generation](https://ai.google.dev/gemini-api/docs/text-generation#generate-a-text-stream) — how streaming works + code samples
2. [`generateContent` API reference](https://ai.google.dev/api/generate-content) — streaming shares the same request shape
3. [`@google/genai` SDK README](https://github.com/googleapis/js-genai) — client usage

## Your task

1. Call `ai.models.generateContentStream()` with:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"List three unusual hobbies, each on its own line."`
   - `config`: `{ maxOutputTokens: 128 }`
2. Iterate the returned async iterable with `for await`.
3. Accumulate text across chunks (use `chunk.text` — it may be an empty string on some chunks, which is fine).
4. Count how many chunks arrived.
5. Return `{ text, chunkCount }`.

## How to verify

```bash
aidev verify 04-streaming
```

Tests check:
- Exactly 1 API call is made
- The streaming method is used (`generateContentStream`, `streamed: true`)
- Return value has a non-empty `text` string
- `chunkCount` is at least 1
- The harness-assembled response has candidates (proves streaming round-trip completed)

## Extra concept (optional)

Streaming changes your error handling: if the model starts generating and then fails mid-stream (rate limit, safety block, network drop), you'll have PARTIAL text. Defensive code accumulates into a buffer and only commits when iteration completes successfully.

For a live demo, run:

```bash
aidev run 04-streaming --solution --stream-live
```

That flag prints each chunk's text as it arrives — you can see the pacing Google uses. The harness catches the chunks for the test regardless of whether you consume them live.
