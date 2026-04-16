# Exercise 05 — Orchestrate multiple tools in a complex agent

## Concept

This is the exercise that integrates everything you learned in the Agents track. You'll build an agent with **4 tools** that collaborate to solve a real-world task: find a product, verify price and stock, and add it to the cart. No single tool can solve the problem on its own — the agent must **orchestrate** their use.

Orchestration is the art of coordinating multiple tools with dependencies between them. The model can't add to the cart without knowing the product ID. It can't check stock without the ID. It has to search first, evaluate results, decide which product to investigate further, and only then act. This chained reasoning — where the output of one tool is the input of the next — is what distinguishes an agent from a simple function call.

By implementing this pattern, you understand why frameworks like LangGraph, AutoGen, or CrewAI exist: the loop you're writing by hand is exactly what they abstract and formalize with observability tooling, error handling, and state management.

```
User: "Find a laptop under $1000 in stock"
  ↓ search_products("laptop")
  ↓ get_price("laptop-001")       ← $899 ✓
  ↓ check_stock("laptop-001")     ← 5 units ✓
  ↓ add_to_cart("laptop-001", 1)  ← success
  ↓ "Added ProBook 15 Laptop ($899) to your cart."
```

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — OpenAI client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — orchestrating multiple tools with dependencies
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — complete parameter reference for tool calling

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client and a `messages` array with: `{ role: "user", content: "Find a laptop under $1000 that's in stock and add it to my cart." }`.
3. Define four tools:
   - `search_products(query: string)` — returns a list of products.
   - `get_price(productId: string)` — returns the product price.
   - `check_stock(productId: string)` — returns whether it's in stock.
   - `add_to_cart(productId: string, quantity: number)` — adds to the cart.
4. Implement the agent loop.
5. Execute each tool with the matching fake function.
6. When `add_to_cart` is executed: push the result to the `cartItems` array.
7. Increment `totalSteps` each time you process tool calls.
8. When the loop ends: save the last assistant message content as `finalSummary`.
9. Return `{ cartItems, totalSteps, finalSummary }`.

## How to verify

```bash
aidev verify 05-tool-orchestration
```

The tests verify:
- At least 3 API calls were made
- At least 2 distinct tool names were used
- `cartItems` is an array with at least 1 item
- `totalSteps` >= 2
- `finalSummary` is a non-empty string
- The last call has `finish_reason: "stop"`

## Extra concept (optional)

Production agents need **observability**: logs of every tool call, traces of model decisions, latency and cost metrics. Tools like LangSmith, Langfuse, or Arize let you visualize the full execution graph of an agent. When something goes wrong in production, without observability it's nearly impossible to debug — was it the prompt? The tool? Did the model choose wrong? Observability transforms agent debugging from a dark art into a systematic process.
