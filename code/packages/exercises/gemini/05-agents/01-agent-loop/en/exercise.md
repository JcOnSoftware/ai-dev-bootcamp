# Exercise 01 — Build the core agent loop

## Concept

Exercise 02 of track 03 (function-calling) did a manual TWO-turn loop: user → model-calls-tool → you-execute-tool → model-answers. That's enough when you know in advance the model only needs one tool call. Real agents don't work that way — they chain MANY tool calls, decide when to stop, and sometimes escalate to other tools mid-conversation.

The **agent loop** is the control structure that makes this work:

```
contents = [user_message]
loop:
  response = generateContent(contents, tools)
  if response has NO function calls:
    return response.text  # final answer
  execute each function call
  append model's calls + your results to contents
  repeat
```

Two things matter:

1. **Termination**: a model stuck in a tool-calling rut can hit max-turns forever. Always cap iterations. A sensible ceiling is 5-10 for general tasks, 20-30 for long-running research agents.
2. **Append-don't-replace**: each turn adds to `contents`. You NEVER replace it. The model sees the whole history on every turn.

You'll build the loop against a simple `multiply(a, b)` stub tool. The user says "what is 37 × 42?" and the model should call `multiply`, read the result, then return the natural-language answer including 1554.

## Docs & references

1. [Function calling guide](https://ai.google.dev/gemini-api/docs/function-calling) — the full lifecycle
2. [Multi-turn tool loop](https://ai.google.dev/gemini-api/docs/function-calling#multi-turn) — the `contents` shape through turns
3. [`Content` resource](https://ai.google.dev/api/caching#Content) — role + parts structure

## Your task

1. Build an initial `contents` array with the user message (`"What is 37 times 42? Use the multiply tool."`).
2. Loop up to `MAX_TURNS` (use 6):
   - Call `generateContent` with `model: "gemini-2.5-flash"`, `contents`, and `config.tools: [{ functionDeclarations: [MULTIPLY_DECL] }]`.
   - If `response.functionCalls` is empty → return `{ turnCount, toolCalls, answer: response.text }`.
   - Otherwise, append TWO messages to `contents`:
     - `{ role: "model", parts: [{ functionCall }] }` — the model's announced call
     - `{ role: "user", parts: [{ functionResponse: { name, response: multiply(args) } }] }` — your result
   - Record each call name in `toolCalls`.
3. If the loop hits `MAX_TURNS`, throw — the agent got stuck.

## How to verify

```bash
aidev verify 01-agent-loop
```

Tests check:
- At least 2 `generateContent` calls (the loop ran at least two turns)
- The LAST captured response has NO `functionCall` part (termination signal)
- Return has `{ turnCount, toolCalls, answer }`
- At least one tool call happened and all invocations are `multiply`
- `turnCount` matches the number of `generateContent` calls the harness saw
- Final `answer` contains `1554` (the correct product)

## Extra concept (optional)

In a real agent, `MAX_TURNS` doesn't just prevent infinite loops — it's also a **budget control**. Each turn costs money and latency. For a chatbot you might cap at 3 and fall back to "I couldn't figure this out, could you rephrase?" when you exceed the budget.

Some models are trained to "think out loud" before tool calls — you'll see text + a function call in the same response. Keep appending both to history; Gemini handles them fine. Don't filter out the text parts on model turns.

The next exercises extend this: multi-step task chains (02), planner-executor structure (03), memory across user turns (04), and error recovery when tools throw (05).
