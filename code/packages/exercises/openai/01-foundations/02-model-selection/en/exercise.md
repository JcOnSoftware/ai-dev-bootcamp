# Exercise 02 — Model selection and comparison

## Concept

OpenAI offers several models with different trade-offs between **capability, speed, and cost**. Not every problem needs the most expensive model — choosing wisely is a critical production skill.

The two models you'll compare today:

| Model | Cost (input/output per 1M tokens) | When to use |
|-------|-----------------------------------|-------------|
| `gpt-4.1-nano` | $0.10 / $0.40 | Simple tasks, high volume, prototypes |
| `gpt-4o-mini`  | $0.15 / $0.60 | Moderate reasoning, better instruction following |

For the same prompt you'll get similar responses, but `gpt-4o-mini` tends to be more precise on reasoning and complex instructions. `gpt-4.1-nano` is 33% cheaper and faster for simple tasks.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — full endpoint reference
3. [Models](https://platform.openai.com/docs/models) — available models with capabilities and pricing

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client.
3. Use the prompt `"Explain what an API is in one sentence."` to make **two separate calls**:
   - First call: model `"gpt-4.1-nano"`
   - Second call: model `"gpt-4o-mini"`
4. Return both responses as `{ nano: ChatCompletion, mini: ChatCompletion }`.

Tip: make the calls sequentially with `await`. The responses are independent.

## How to verify

```bash
aidev verify 02-model-selection
```

Tests check:
- Exactly 2 API calls are made
- One uses `gpt-4.1-nano` and the other `gpt-4o-mini`
- Both receive responses with non-empty content
- Both report token usage
- Returns an object with `nano` and `mini` properties

## Extra concept (optional)

You can make both calls **in parallel** with `Promise.all` to reduce total latency:

```typescript
const [nano, mini] = await Promise.all([
  client.chat.completions.create({ model: "gpt-4.1-nano", ... }),
  client.chat.completions.create({ model: "gpt-4o-mini", ... }),
]);
```

This is useful when calls are independent of each other. If one depends on the result of the other, you need to make them sequentially.
