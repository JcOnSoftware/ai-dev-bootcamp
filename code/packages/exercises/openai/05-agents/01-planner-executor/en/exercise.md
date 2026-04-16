# Exercise 01 — Build the basic agent loop

## Concept

An **agent** is nothing more than a program that repeats three steps: **think** (the model decides what to do), **act** (you execute the tool it chose), and **observe** (you return the result so it can keep reasoning). That cycle — think, act, observe — is the foundation of everything we call an "agent" in AI.

The fundamental difference from the tool calling exercises before is that you don't know in advance how many times the model will call a tool. It might request one tool, receive the result, request another tool with that info, and keep going until it has enough context to answer. You need a `while` loop that terminates when the model says "I'm done" (`finish_reason: "stop"`).

The pattern is called **planner-executor**: the model is the planner (decides what to do), and your code is the executor (does it). This separation of responsibilities is what makes agents powerful — the model doesn't execute anything directly, it only reasons and chooses tools.

```typescript
// Loop structure
while (true) {
  const response = await client.chat.completions.create({ messages, tools });
  messages.push(response.choices[0].message);
  if (response.choices[0].finish_reason === "stop") break;
  // execute tools and append results to messages
}
```

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — OpenAI client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — full tool calling cycle and how to build the loop
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — reference for `finish_reason`, `tool_calls`, and `role: "tool"` messages

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client and a `messages` array with: `{ role: "user", content: "How many seconds are in 3.5 hours?" }`.
3. Define two tools:
   - `search_web(query: string)` — searches for information on the web.
   - `calculate(expression: string)` — evaluates a math expression.
4. Implement the agent loop with `while (true)`:
   - Call the API with `model: "gpt-4.1-nano"`, `max_completion_tokens: 512`.
   - Push the assistant message into `messages`.
   - If `finish_reason === "stop"`: save the content as `finalAnswer` and break.
   - If `finish_reason === "tool_calls"`:
     - Increment a `steps` counter.
     - For each tool call: run `fakeSearchWeb` or `fakeCalculate` based on the name.
     - Push `{ role: "tool", tool_call_id, content: JSON.stringify(result) }` for each result.
5. Return `{ steps, finalAnswer }`.

## How to verify

```bash
aidev verify 01-planner-executor
```

The tests verify:
- At least 2 API calls were made (the loop ran at least one tool round-trip)
- The first call has `finish_reason: "tool_calls"`
- The last call has `finish_reason: "stop"`
- `steps` is a number >= 1
- `finalAnswer` is a non-empty string

## Extra concept (optional)

Real-world agents implement **safety guards**: maximum iteration counts (to prevent infinite loops), per-call timeouts, and cycle detection (the model requests the same tool with the same args twice). Without these controls, a bug in the prompt can cause the agent to spin indefinitely consuming tokens and money. In production, always add `if (steps > MAX_STEPS) break` as a safety net.
