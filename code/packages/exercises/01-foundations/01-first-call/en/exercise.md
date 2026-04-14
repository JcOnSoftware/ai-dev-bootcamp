# Exercise 01 — Your first Claude call

## Concept

Before agents, tool use, or RAG: **a model call is just HTTP with a specific format**. Three non-negotiable pieces:

1. **Client** — an authenticated SDK instance. It reads `ANTHROPIC_API_KEY` from the environment automatically.
2. **Model** — which Claude variant you use. Each model has cost/speed/capability tradeoffs. For learning: use **Haiku** (cheap and fast).
3. **Messages** — an array of turns `{ role, content }`. The first turn is usually `user`.

The SDK responds with a `Message` object containing `content` (array of blocks, usually one of type `text`), `usage` (tokens in/out), `model`, and `stop_reason`.

## Docs & references

Read these in order — they are official and always up to date:

1. **SDK README (TypeScript)** — how to instantiate the client (`new Anthropic()`) and the first working example:
   → https://github.com/anthropics/anthropic-sdk-typescript
2. **Messages API reference** — all parameters for `client.messages.create` (`model`, `max_tokens`, `messages`, `system`, etc.):
   → https://platform.claude.com/docs/en/api/messages
3. **Models overview** — table of model IDs (Opus 4.6, Sonnet 4.6, Haiku 4.5), pricing and tradeoffs:
   → https://platform.claude.com/docs/en/docs/about-claude/models/overview

> Tip: the SDK also ships TS types. In your editor, hover over `messages.create` to see the full signature without leaving VS Code.

## Your task

Open `starter.ts`. There is a `run` function that must:

1. Create an Anthropic client
2. Call `messages.create` with:
   - A model from the Haiku family (see Models overview above for the exact ID)
   - A reasonable `max_tokens` (≤ 200 is enough)
   - A `user` message asking for a short greeting in English
3. Return the response

No parsing needed — the harness captures the call and the response.

## How to verify

```bash
# From code/, with ANTHROPIC_API_KEY configured (via `aidev init` or .env):
aidev verify 01-first-call
```

The tests validate:
- You made exactly one API call
- You used a Claude model (preferably Haiku)
- You passed a reasonable `max_tokens`
- The user message has content
- The response arrived with at least one text block
- The response includes `usage` with `input_tokens` > 0 and `output_tokens` > 0

## Extra concept (optional)

Look at the `usage` object the SDK returns: `input_tokens` and `output_tokens`. That is what you PAY. Each model has different rates per million tokens — see Models overview above. Understanding this is the foundation for optimizing cost.
