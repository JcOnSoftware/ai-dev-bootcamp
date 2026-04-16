# Exercise 02 — Implement the tool calling loop

## Concept

In the previous exercise the model asked you to call a function but you didn't execute it. Now you close the loop. The **tool calling loop** is the fundamental agentic pattern: the model decides which tool it needs, you execute it and return the result, and the model uses that result to produce a final answer.

The full cycle involves exactly two API calls:

1. **First call**: send the user message plus available tools. The model responds with `finish_reason: "tool_calls"` and a `tool_calls` array on the assistant message.
2. **Execute the tools**: read `tool_calls`, run each function with the arguments the model provided, and append the results to the history as messages with `role: "tool"`.
3. **Second call**: send the full history (original messages + assistant message + tool results). The model now has all the information and responds with final text.

```typescript
// After executing the tool, the messages array looks like this:
messages = [
  { role: "user",      content: "What's the weather in Buenos Aires?" },
  { role: "assistant", content: null, tool_calls: [{ id: "call_abc", ... }] },
  { role: "tool",      tool_call_id: "call_abc", content: '{"temperature":22,"condition":"sunny"}' },
]
```

Note: the `tool_call_id` in the result must exactly match the `id` of the tool_call that generated it.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — official guide covering the full cycle
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — reference for `tools` and `role: "tool"` messages

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client and a `messages` array with the user message.
3. Define the `get_weather` tool with parameter `location` (string, required).
4. Make the **first API call** with `model: "gpt-4.1-nano"`, `max_completion_tokens: 512`.
5. Push the assistant message into the `messages` array.
6. For each `toolCall` in `assistantMessage.tool_calls`:
   - Parse `toolCall.function.arguments` to get `location`.
   - Call `fakeGetWeather(location)`.
   - Push `{ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) }`.
7. Make the **second API call** with the updated messages.
8. Return the final response.

## How to verify

```bash
aidev verify 02-tool-calls-loop
```

The tests verify:
- Exactly 2 API calls are made
- The first call has `finish_reason: "tool_calls"`
- The second call includes a message with `role: "tool"`
- The tool message has a non-empty `tool_call_id`
- The tool message content is valid JSON with `temperature` and `condition`
- The final response has `finish_reason: "stop"`
- The final response has text content

## Extra concept (optional)

In production, the loop doesn't end after a single round of tools. A real agent keeps calling the model and executing tools until it receives `finish_reason: "stop"`. That pattern — a `while` loop that exits when the model stops requesting tools — is the foundation of every agent framework (LangChain, LlamaIndex, etc.). You implement it in the Agents track.
