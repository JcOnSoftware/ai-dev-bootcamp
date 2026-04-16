# Exercise 02 — Multi-step reasoning with chained tools

## Concept

In the previous exercise the agent needed only a few tools to answer. In reality, interesting problems require **chaining multiple tools** — the result of one tool feeds into the next, building up toward a complete answer.

This pattern is called **chain-of-tools** or multi-step reasoning: the model decomposes the problem into sub-tasks, executes each one sequentially using the previous result as context, and finally synthesizes everything into a response. It's exactly how you solve a complex problem: first collect data, then process it, then compare, and only then answer.

The key architectural insight is that **the messages history is the agent's memory**. Every tool result you add to the `messages` array becomes available to the model in the next iteration. You don't need external state management — the accumulated context in `messages` is everything the agent needs to reason.

```typescript
// The history grows with each iteration
messages = [
  { role: "user",      content: "Which city has higher density?" },
  { role: "assistant", tool_calls: [{ name: "get_population", args: {city:"Tokyo"} }] },
  { role: "tool",      content: '{"population":13960000}' },
  { role: "assistant", tool_calls: [{ name: "get_area", args: {city:"Tokyo"} }] },
  // ... and continues
]
```

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — OpenAI client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — how to chain multiple tools in an agent loop
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — message structure and tool calls in the history

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client and a `messages` array with: `{ role: "user", content: "Which city has higher population density: Tokyo or London?" }`.
3. Define three tools:
   - `get_population(city: string)` — returns a city's population.
   - `get_area(city: string)` — returns the area in km².
   - `calculate(expression: string)` — evaluates a math expression.
4. Implement the agent loop (same pattern as exercise 01).
5. Execute each tool call with the matching fake function.
6. Return `{ totalCalls, finalAnswer }` where `totalCalls` is the number of API calls made.

## How to verify

```bash
aidev verify 02-multi-step-reasoning
```

The tests verify:
- At least 3 API calls were made (the model needs multiple rounds)
- `totalCalls` >= 3
- `finalAnswer` is a non-empty string
- At least 2 distinct tool names were used
- The last call has `finish_reason: "stop"`

## Extra concept (optional)

Multi-step reasoning has a cost: each loop iteration makes an API call and grows the context in the history. For problems with many steps, token costs can grow significantly. Mitigation strategies: **parallel tool calling** (the model requests multiple tools in a single turn), **tool result summarization** (you periodically summarize the history), or **graph-based agents** (each graph node is a tool, avoiding redundancies). LangGraph and CrewAI implement these ideas.
