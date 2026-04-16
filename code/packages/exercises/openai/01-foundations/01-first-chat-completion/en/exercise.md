# Exercise 01 — Your first chat completion

## Concept

OpenAI's API is organized around **chat completions** — you send a list of messages and receive a model response. Each message has a `role` (`system`, `user`, `assistant`) and `content`.

The Node.js SDK (`openai`) reads `OPENAI_API_KEY` from the environment automatically. You create a client, call `client.chat.completions.create()` with the model, messages, and a token limit, and receive a `ChatCompletion` object with `choices`, `usage`, and `model`.

The cheapest available model is `gpt-4.1-nano` — ideal for learning without spending. Each call in this exercise costs fractions of a cent.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — full endpoint reference
3. [Models](https://platform.openai.com/docs/models) — available models and their capabilities

## Your task

1. Open `starter.ts` and create an OpenAI client instance.
2. Call `client.chat.completions.create()` with:
   - `model`: `"gpt-4.1-nano"` (cheapest option)
   - `max_completion_tokens`: a number between 1 and 200
   - `messages`: an array with a single `"user"` role message
3. Return the full response (the `ChatCompletion` object).

## How to verify

```bash
aidev verify 01-first-chat-completion
```

Tests check:
- Exactly 1 API call is made
- A GPT model is used
- `max_completion_tokens` is between 1 and 500
- One user message with non-empty content is sent
- Response has at least one choice with content
- Token usage is reported (prompt + completion)

## Extra concept (optional)

OpenAI's response structure differs from other providers. Instead of a `content` array with typed blocks, OpenAI uses `choices[0].message.content` as a string. The `finish_reason` field tells you why the model stopped: `"stop"` (finished naturally), `"length"` (hit token limit), or `"tool_calls"` (wants to use a tool).
