# Exercise 04 — Parallel tool execution

## Concept

OpenAI can return **multiple tool calls in a single response**. Instead of asking for Tokyo's weather, waiting for the result, then London, then New York — the model says it all at once: "I need get_weather for Tokyo, London, and New York simultaneously." That's **parallel tool calling** and it's enabled by default.

The difference from the previous exercise is that the `tool_calls` array may have 2, 3, or more entries in the same response, all referencing the same function with different arguments. Your responsibility is to execute **all of them** and return **all results** before making the second call.

```typescript
// firstResponse.choices[0].message.tool_calls may contain:
[
  { id: "call_1", function: { name: "get_weather", arguments: '{"location":"Tokyo"}' } },
  { id: "call_2", function: { name: "get_weather", arguments: '{"location":"London"}' } },
  { id: "call_3", function: { name: "get_weather", arguments: '{"location":"New York"}' } },
]
// You must reply with 3 role: "tool" messages before the second API call
```

Using `Promise.all` to execute tools concurrently is the correct practice: if each tool took 1 second, sequential execution would take 3 seconds, but in parallel they all finish in 1.

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — parallel tool calling section
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — `parallel_tool_calls` parameter

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client.
3. Define the `get_weather(location: string)` tool.
4. Start messages with: `"What's the weather in Tokyo, London, and New York?"`
5. Make the **first API call** with `model: "gpt-4.1-nano"`, `max_completion_tokens: 512`, and `parallel_tool_calls: true`.
6. Save all `tool_calls` from the response.
7. Execute **ALL** of them concurrently with `Promise.all`, calling `fakeGetWeather` for each.
8. Push a `role: "tool"` message per result.
9. Make the **second API call** with the updated messages.
10. Return `{ toolCallCount: toolCalls.length, response: finalResponse }`.

## How to verify

```bash
aidev verify 04-parallel-tool-execution
```

The tests verify:
- At least 2 API calls are made
- The first response has at least 2 tool_calls (parallel)
- The second call has at least 2 `role: "tool"` messages
- `userReturn.toolCallCount` is >= 2
- The final response has text content and `finish_reason: "stop"`

## Extra concept (optional)

`parallel_tool_calls: false` tells the model to only request one tool at a time, sequentially. This is useful when tools have dependencies (e.g., authenticate first, then read data). It defaults to `true` because in most cases you want concurrency.
