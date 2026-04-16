# Exercise 03 — Multi-turn conversation memory

## Concept

The OpenAI API is **stateless** — it remembers nothing between calls. For the model to "remember" what was said earlier, YOU have to send the full history in every request. This is how the multi-turn conversation pattern works:

```
Turn 1: messages = [{ user: "My name is Ada." }]
        → model response → you add it to the array

Turn 2: messages = [
          { user: "My name is Ada." },
          { assistant: "Nice to meet you, Ada!" },
          { user: "What's my name?" }
        ]
        → model responds "Ada" because it has the context
```

Each time you send a request, the `messages` array grows with the previous turns. This is what gives the model "memory" — it doesn't actually remember anything, you pass the full history to it.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — multi-turn `messages` array format

## Your task

1. Open `starter.ts`.
2. Create an empty `messages: ChatCompletionMessageParam[]` array.
3. **Turn 1**: push `{ role: "user", content: "My name is Ada." }`, call the API, push the assistant response.
4. **Turn 2**: push `{ role: "user", content: "What's my name?" }`, call the API, push the response.
5. **Turn 3**: push `{ role: "user", content: "Say my name backwards." }`, call the API — this is `finalResponse`.
6. Return `{ turns: 3, finalResponse }`.

Use `model: "gpt-4.1-nano"` and `max_completion_tokens: 64` in each call.

## How to verify

```bash
aidev verify 03-conversation-memory
```

Tests check:
- Exactly 3 API calls are made
- The first call has exactly 1 message
- The last call has at least 5 messages (accumulated history)
- `turns` is `3`
- `finalResponse` has content (non-empty string)
- Each subsequent call has more messages than the previous one

Tests do NOT assert on exact response text.

## Extra concept (optional)

This pattern of "passing the full history in every request" is exactly what ChatGPT, Claude.ai, and all modern chatbots use. The difference lies in how they handle long-term memory:

- **Window-based**: only the last N conversations (what you did here)
- **Summarization**: when the history is too long, summarize it before passing it (next exercise)
- **Vector memory**: embeddings of past conversations to search for what's relevant (RAG)
- **External storage**: store history in a DB and load it as needed

For most use cases, window-based + summarization is more than sufficient.
