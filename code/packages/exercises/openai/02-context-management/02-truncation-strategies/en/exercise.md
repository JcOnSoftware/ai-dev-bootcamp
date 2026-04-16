# Exercise 02 — Truncation strategies for long conversations

## Concept

In real chat applications, conversation history grows with every turn. If you send the full history every time, you'll eventually exceed the context limit — or simply pay too much in tokens. The simplest solution is **truncation**: discard older messages and keep only the most recent ones.

The golden rule is: **always preserve the system message** (which defines the assistant's behavior) and **the last N messages** from the history.

```typescript
// Strategy: system message + last 6 messages (3 exchanges)
const truncatedMessages = [systemMessage, ...history.slice(-6)];
```

This strategy is O(1) in complexity and requires no token counting — you simply limit the number of messages. The downside is that you might lose important context that was established early in the conversation.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — `messages` array format

## Your task

1. Open `starter.ts`.
2. Create a system message: `"You are a helpful assistant that discusses programming topics."`
3. Build a history with 5 user/assistant pairs (10 messages total). You can use any topic — programming questions work well.
4. Compute `originalCount = 1 + 10 = 11` (system + history).
5. Apply truncation: `const truncatedMessages = [systemMessage, ...history.slice(-6)]`.
6. Compute `truncatedCount = truncatedMessages.length` (should be 7).
7. Send the truncated messages with `model: "gpt-4.1-nano"` and `max_completion_tokens: 128`.
8. Return `{ originalCount, truncatedCount, response }`.

## How to verify

```bash
aidev verify 02-truncation-strategies
```

Tests check:
- Exactly 1 API call is made
- The request has at most 7 messages
- The first message in the request is the system message
- The response has content (non-empty string)
- `originalCount > truncatedCount`
- `truncatedCount` matches the number of messages sent

## Extra concept (optional)

Truncating by message count is simple but imprecise. In production, the ideal approach is to truncate by **token count** using a library like `tiktoken`:

```typescript
import { encoding_for_model } from "tiktoken";

function countTokens(messages: ChatCompletionMessageParam[]): number {
  const enc = encoding_for_model("gpt-4o");
  return messages.reduce((sum, msg) => {
    return sum + enc.encode(typeof msg.content === "string" ? msg.content : "").length + 4;
  }, 0);
}
```

This lets you truncate until you're under a specific token limit (e.g. 3000), rather than a fixed message count.
