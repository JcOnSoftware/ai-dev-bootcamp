# Exercise 03 — Streaming responses

## Concept

So far you've called the model, waited for it to finish, and received the complete response. That's called **blocking mode**. It has a problem: while the model generates 500 tokens, your UI is frozen. The user sees a spinner and has no idea if anything is happening.

**Streaming** solves this. Instead of waiting for the full message, you receive a stream of **events** while the model generates:

- `message_start` — the model started; has id, model, role, etc.
- `content_block_start` — a text or tool_use block is about to begin.
- `content_block_delta` — a chunk of text (typically a few words).
- `content_block_stop` — the block ended.
- `message_delta` — top-level updates (final usage, stop_reason).
- `message_stop` — the message is done.

For most cases (plain text), you care about `content_block_delta` events where `delta.type === "text_delta"`. You accumulate them into a string as they come in, and that's what you show the user in real time.

**Why you care:**

1. **UX**. A chat that prints token by token feels fast. The same chat waiting 4 seconds for the full response feels broken.
2. **Long responses**. Generating 4000 tokens? The user sees progress from second one.
3. **Cancellation**. You can cut the stream if the user changes their mind — saves tokens, saves money.

The SDK offers two equivalent shapes:

```ts
// Form 1: stream() helper (recommended)
const stream = client.messages.stream({ ... });

// Form 2: create with stream: true
const stream = await client.messages.create({ stream: true, ... });
```

Both return an iterable with `.finalMessage()` — the method that gives you the accumulated message when the stream ends, so you don't have to reconstruct it yourself.

## Docs & references

1. **Streaming messages** — official guide with events, examples, patterns:
   → https://platform.claude.com/docs/en/build-with-claude/streaming
2. **SDK README (TypeScript)** — "Streaming responses" section:
   → https://github.com/anthropics/anthropic-sdk-typescript
3. **Messages API reference** — `stream: true` parameter:
   → https://platform.claude.com/docs/en/api/messages

> Tip: the stream's iterable implements `AsyncIterable<MessageStreamEvent>`. You can use `for await (const event of stream)` directly.

## Your task

Open `starter.ts`. There's a `run` function that must:

1. Create an Anthropic client.
2. Start a **stream** against Haiku asking for something short (e.g. "In 3 sentences, tell a funny anecdote about programming"). Use `max_tokens` ≤ 300.
3. Iterate the stream's events and accumulate the text of `content_block_delta` events whose `delta.type === "text_delta"` into a string.
4. When done, get the final message via `await stream.finalMessage()`.
5. Return `{ accumulatedText, finalMessage }`.

The harness captures the `finalMessage` automatically when it detects the stream — you only need to write real streaming code.

## How to verify

```bash
# From code/:
aidev verify 03-streaming
```

The tests check:
- You made exactly ONE API call with `stream: true`.
- The call was captured as `streamed: true` by the harness.
- You used a Haiku model.
- Your returned `accumulatedText` is a non-empty string.
- `accumulatedText` matches (or is equivalent to) the text in `finalMessage`.
- The captured `finalMessage` has at least one text block.
- Reasonable `max_tokens` (1..500).

## Extra concept (optional)

Look at `finalMessage.usage`. The `output_tokens` are what you paid. Streaming **does not change cost** — you pay the same as blocking mode. The value of streaming is **perceived**: the user sees text appear, doesn't lose patience. It's the difference between a chat that feels alive and one that feels stuck.

Bonus: if your UI supports it, print each delta with `process.stdout.write(delta.text)` while iterating. You'll see the text appear word by word in your terminal — that's what a real user SEES.
