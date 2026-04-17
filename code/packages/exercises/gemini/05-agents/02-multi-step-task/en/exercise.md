# Exercise 02 — Chain multiple tool calls for a multi-step task

## Concept

The agent loop you built in exercise 01 handled ONE tool call. Real tasks usually need several, IN ORDER, with each step's output feeding into the next. Example: `"Compute (12 * 7) + 9"` — you can't just call `add` first. You have to:

1. `multiply(12, 7)` → 84
2. `add(84, 9)` → 93

The model reasons about this sequence. Your job as the agent author is NOT to teach it the recipe — the loop does that naturally. Your job is to:

- Give it both tools
- Run the loop long enough to accommodate chaining
- Route each function call to the right stub (a dispatcher table)

## Docs & references

1. [Function calling guide](https://ai.google.dev/gemini-api/docs/function-calling) — multi-turn semantics
2. [Multi-turn loop shape](https://ai.google.dev/gemini-api/docs/function-calling#multi-turn) — reminder
3. [Prompting for chained reasoning](https://ai.google.dev/gemini-api/docs/prompting-strategies) — Google's tips

## Your task

1. Reuse the loop from exercise 01. Include BOTH `multiply` and `add` in `functionDeclarations`.
2. Build a dispatcher:
   ```ts
   const DISPATCH: Record<string, (args: Record<string, number>) => unknown> = {
     multiply: (a) => multiply(a as { a: number; b: number }),
     add: (a) => add(a as { a: number; b: number }),
   };
   ```
3. In the loop, when you see a `functionCall`, route it via `DISPATCH[name](args)`.
4. User prompt: `"Compute (12 * 7) + 9 using the tools provided. Show the final number."`
5. Loop through until no function calls remain. Return `{ turnCount, toolCalls, answer }`.

## How to verify

```bash
aidev verify 02-multi-step-task
```

Tests check:
- At least 3 `generateContent` calls (turn 1, turn 2, turn 3+)
- Both `multiply` and `add` appear in `toolCalls`
- **Order**: `multiply` appears BEFORE `add` (the only correct sequence)
- Final answer contains `93` (the correct result)
- Return shape is `{ turnCount, toolCalls, answer }`

## Extra concept (optional)

Dispatcher tables scale. When you go from 2 tools to 20, `if/else` chains become unreadable; a `Record<string, fn>` stays clean. They also make unit testing easy — you can substitute stubs per tool.

The order-matters assertion in the tests reveals the model's genuine reasoning. If the loop failed to cascade the multiply result into the add call (because the `functionResponse` shape was wrong, or the contents were dropped between turns), the model would either guess or fall back to simple addition of the wrong operands. The "contains 93" test catches all of those regressions at once.

For longer chains (5-10 tools deep), watch out for **cumulative hallucination**: if one tool returns garbage, the next tool's args might be garbage too, and the model still produces a confident-sounding answer. Add validation on tool RESPONSES — if `{ product: NaN }`, stop the loop rather than feed bad data forward.
