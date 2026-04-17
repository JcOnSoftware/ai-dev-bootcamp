# Exercise 03 — Plan then execute — force a visible plan before acting

## Concept

One of the most effective agent patterns: **make reasoning visible before action**. When the model writes out its plan first, you get three wins at once:

1. **Debuggability**: when the agent does something wrong, you can read the plan and see where its understanding diverged from the task.
2. **Auditability**: the plan becomes a natural log you can show users ("I'll first multiply, then add the result to 17").
3. **Quality**: models reason better when forced to externalize the plan — fewer silent mis-steps.

Gemini (like most LLMs) can emit **mixed content** in a single turn: text parts AND functionCall parts. You control this behavior with a **system instruction**:

```ts
config.systemInstruction = "Always start your response with a one-sentence plan ..."
```

System instructions persist across turns, so every model response follows the rule. You'll also still receive text on the FINAL turn (when there are no more tool calls to make).

## Docs & references

1. [System instructions](https://ai.google.dev/gemini-api/docs/text-generation#system-instructions) — when and how to use them
2. [Function calling guide](https://ai.google.dev/gemini-api/docs/function-calling) — mixed text + tool-call responses
3. [`Part` reference](https://ai.google.dev/api/caching#Part) — text, functionCall, functionResponse parts

## Your task

1. Reuse the agent loop from exercises 01/02. Include both `multiply` and `add`.
2. Add `config.systemInstruction` on EVERY turn:
   ```
   Always start your response with a one-sentence plan describing which tools you will call and in what order. Then immediately call the tools. Do not execute tools before describing the plan.
   ```
3. Capture `response.text` on the FIRST turn only — that's the plan.
4. User prompt: `"Compute (8 * 9) + 17 using the tools provided."`
5. Run the loop, collect tool calls, return:
   ```ts
   { firstTurnText, toolCalls, answer }
   ```

## How to verify

```bash
aidev verify 03-plan-then-execute
```

Tests check:
- Every captured call has a non-trivial `systemInstruction` in its config
- `firstTurnText` is non-empty (the plan was visible)
- The plan mentions BOTH `multiply` and `add` by name
- Tools were called in the correct order (`multiply` before `add`)
- Final answer contains `89` (= 8 × 9 + 17)

## Extra concept (optional)

Variants of this pattern have fancier names: **ReAct** (reason + act interleaved per step), **chain-of-thought with tools**, **plan-and-execute**. They're all variations of the same core idea: externalize reasoning.

In high-stakes workflows you can go further — save the PLAN as a separate artifact in your database before execution starts. If the plan looks wrong, a human can veto before any side-effects happen (email sent, DB row created, money moved). For non-critical workflows, logging the plan at INFO level is enough.

The risk of visible planning: longer outputs cost more tokens and latency. Balance is key — force a plan for tasks with risk or ambiguity, let the model skip straight to action for mechanical lookups.
