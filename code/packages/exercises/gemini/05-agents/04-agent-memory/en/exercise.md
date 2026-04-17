# Exercise 04 — Carry conversation memory across user turns

## Concept

Every exercise so far processed ONE user message. Real assistants handle **follow-up questions**: "multiply 6 and 7" → "now add 8 to that". The second message only makes sense if the model remembers the first.

Gemini has no built-in memory. **YOU** carry it, in the `contents` array. The rule is simple:

- After the agent finishes answering turn 1, you APPEND the new user message to the SAME `contents` array.
- You run the loop again.
- The model sees the full history: original question → model's tool calls → tool results → model's answer → new question.

That's it. No session handle, no state API. The `contents` array IS the memory.

Two practical consequences:

1. **Context grows linearly** with conversation length. Eventually you hit the context window and have to truncate old turns (or summarize them — see track 06 `context-management` in the OpenAI track for patterns).
2. **Recording the model's FINAL text turn matters**. If you only push user messages + tool calls/results and skip the model's natural-language response, a follow-up like "explain that further" has nothing to anchor on.

## Docs & references

1. [Multi-turn conversation guide](https://ai.google.dev/gemini-api/docs/text-generation#multi-turn-conversations) — how history works
2. [Function calling multi-turn](https://ai.google.dev/gemini-api/docs/function-calling#multi-turn) — recap of the `contents` shape
3. [`Content` + `Part` reference](https://ai.google.dev/api/caching#Content) — roles (user / model) and part types

## Your task

1. Build ONE shared `contents: Content[]` for the whole conversation.
2. Push the first user message: `"Multiply 6 and 7 using the tool."`
3. Run the agent loop. When it finishes, ALSO push the model's final text turn to `contents` (so it's in history).
4. Push the second user message: `"Now add 8 to that number."`
5. Run the agent loop again on the same `contents`.
6. Return `{ firstAnswer, secondAnswer, totalTurns, toolsUsed }`.

## How to verify

```bash
aidev verify 04-agent-memory
```

Tests check:
- At least 4 `generateContent` calls (2 user questions × 2 turns each)
- Return has `{ firstAnswer, secondAnswer, totalTurns, toolsUsed }`
- `firstAnswer` contains `42` (= 6 × 7)
- **`secondAnswer` contains `50` (= 42 + 8)** — the memory check
- Both `multiply` and `add` appear in `toolsUsed`
- The LATER `generateContent` call's `contents` array includes BOTH user text messages (history was preserved)

## Extra concept (optional)

In production, memory isn't just "append-forever". Strategies:

- **Sliding window**: keep last N turns, drop older.
- **Summarization**: when context gets long, replace old turns with a summary (lossy but cheap).
- **Vector-indexed history**: store every turn in a vector DB; retrieve relevant past turns by semantic similarity to the current question.

The bootcamp's OpenAI track 02 covers some of these. For Gemini, the same patterns apply — just swap in the Gemini SDK.

One subtle trap: when you APPEND the model's text turn to `contents`, make sure you use `role: "model"` and `parts: [{ text: ... }]`. Using `role: "user"` for the model's output confuses the next turn's reasoning.
