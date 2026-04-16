# Exercise 04 — Streaming responses token by token

## Concept

By default, OpenAI's API waits until the full response is generated before returning it. **Streaming** changes that: the model sends you tokens as it generates them, enabling progressive text display in the UI (like ChatGPT does).

With `stream: true`, the `create` method returns an **async iterable** of `ChatCompletionChunk` objects. Each chunk has:
```typescript
chunk.choices[0].delta.content  // string | null | undefined — the text fragment
chunk.choices[0].finish_reason  // "stop" | "length" | null — why it stopped (last chunk)
```

The last chunk usually has `choices[0].delta.content` as `undefined` or empty, and `finish_reason` with a value. If you use `stream_options: { include_usage: true }`, the final chunk also includes `usage` with token counts.

To consume the stream you use `for await`:
```typescript
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) process.stdout.write(delta);
}
```

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — full endpoint reference
3. [Streaming guide](https://platform.openai.com/docs/guides/streaming) — official streaming guide

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client and call `client.chat.completions.create` with:
   - `model: "gpt-4.1-nano"`
   - `max_completion_tokens: 128`
   - `messages: [{ role: "user", content: "Count from 1 to 5, one number per line." }]`
   - `stream: true`
   - `stream_options: { include_usage: true }`
3. Iterate over the stream with `for await` and collect non-empty content deltas into a `chunks: string[]` array.
4. Return `{ chunks, fullText: chunks.join("") }`.

## How to verify

```bash
aidev verify 04-streaming-deltas
```

Tests check:
- Exactly 1 API call is made
- The call uses `stream: true`
- The call is marked as `streamed: true`
- Returns `chunks` as an array with at least one element
- Returns `fullText` as a non-empty string
- `fullText` equals `chunks.join("")`

## Extra concept (optional)

In a real app, streaming is used to show progressive text to the user. The typical Node.js pattern is:

```typescript
process.stdout.write(delta); // writes without newline — "typewriter" effect
```

In a web app (React, Next.js), you'd use the `ReadableStream` Streaming API or the Vercel AI SDK, which has helpers to convert an OpenAI stream into a `ReadableStream` compatible with `Response`.

You can also accumulate the stream on the server and emit Server-Sent Events (SSE) to the client — that's what ChatGPT does internally.
