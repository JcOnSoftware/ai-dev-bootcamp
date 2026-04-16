# Exercise 04 — The agent detects and handles tool errors

## Concept

Tools don't always work. In production: APIs fail, data is invalid, operations aren't possible (division by zero, searching for something that doesn't exist, etc.). A robust agent doesn't crash when a tool fails — it informs the model of the error and the model decides what to do next.

The key is understanding how the error flows: **your code executes the tool, gets an error, and returns it to the model as the tool result**. The model sees the error in the history and can: (1) explain to the user what happened, (2) try an alternative approach, or (3) request another tool to solve the problem differently. This is **self-correction** — the model reasons about its own errors.

What you must NOT do is `throw` from the tool executor. If you throw an exception, the loop breaks and the model never learns that the tool failed. Always return the error as a structured result: `{ error: "error message" }`.

```typescript
// BAD — the exception breaks the loop, model never knows
if (b === 0) throw new Error("division by zero");

// GOOD — error is a structured result the model can read
if (b === 0) return { error: "Error: division by zero" };
```

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — OpenAI client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — error handling in tool execution and best practices
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — structure of `role: "tool"` messages with error results

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client and a `messages` array with: `{ role: "user", content: "Calculate 100/5 and then 100/0, handle any errors gracefully." }`.
3. Define the `divide(a: number, b: number)` tool.
4. Implement the agent loop.
5. When executing the tool:
   - Call `fakeDivide(a, b)`.
   - If `result.error` is defined, set `hadError = true`.
   - Always return the result to the model (including errors).
   - Push the result into a `results` array.
6. Return `{ results, hadError }`.

## How to verify

```bash
aidev verify 04-self-correction
```

The tests verify:
- At least 2 API calls were made
- `hadError` is `true`
- `results` is defined as an array
- The final response mentions "error", "zero", "cannot", "undefined", or "division" (model acknowledged the error)
- The last call has `finish_reason: "stop"`

## Extra concept (optional)

Some agents implement **automatic retry strategies**: if a tool fails, the executor retries it with slightly different parameters before returning the error to the model. This is useful for transient errors (network timeouts, rate limits). But you need to be careful with **side effects**: if the tool created a resource partially before failing, the retry might duplicate it. The idempotent pattern — designing tools that are safe to retry — is fundamental in robust agent architectures.
