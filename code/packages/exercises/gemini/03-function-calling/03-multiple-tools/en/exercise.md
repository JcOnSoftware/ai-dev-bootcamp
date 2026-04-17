# Exercise 03 — Router: model picks between multiple tools

## Concept

Real systems expose more than one tool. The model has to **route** — read the user's question, read each tool's name + description, and pick the best fit. This is how a chat-ops bot decides "call `create_ticket`" vs "call `search_kb`" vs "just answer directly."

You'll declare TWO tools:
- `get_weather(location)` — the familiar one
- `get_news_headlines(topic, max?)` — returns recent headlines on a topic

With the prompt `"Give me three recent headlines about AI research."`, the model should pick `get_news_headlines` with `topic = "AI research"`. Not `get_weather` — even though both tools exist in the same array, the weather one has nothing to do with the question.

The quality of routing depends almost entirely on **the description fields**. "Returns weather" can collide with "get news" if both descriptions are vague. Good descriptions specify inputs, outputs, and when to call.

## Docs & references

1. [Function calling guide](https://ai.google.dev/gemini-api/docs/function-calling) — full overview
2. [FunctionDeclaration schema](https://ai.google.dev/api/caching#FunctionDeclaration) — every declaration needs `name`, `description`, `parameters`
3. [Prompting for tool routing](https://ai.google.dev/gemini-api/docs/function-calling#best-practices) — Google's tips

## Your task

1. Declare TWO functions in the SAME `functionDeclarations` array:
   - `get_weather` with one required `location` string parameter
   - `get_news_headlines` with:
     - `topic` (string, required)
     - `max` (integer, optional)
2. Call `generateContent` with:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"Give me three recent headlines about AI research."`
   - `config.tools`: `[{ functionDeclarations: [weather, news] }]`
   - `config.maxOutputTokens`: `256`
3. Read `response.functionCalls[0]`.
4. Return `{ chosenFunction: call.name, chosenArgs: call.args }`.

## How to verify

```bash
aidev verify 03-multiple-tools
```

Tests check:
- Exactly 1 API call
- Request's function declarations array has AT LEAST 2 entries
- One name matches `news|headline`, another matches `weather`
- Return has `chosenFunction: string` + `chosenArgs: object`
- **The model routed to news** (chosen function name includes `news` or `headline`)
- `chosenArgs.topic` is a non-empty string

## Extra concept (optional)

When a tool is never picked across your tests, it's usually a description problem — not a prompt problem. Write descriptions that start with the verb and include typical triggers: `"Searches the internal knowledge base by keyword. Use when the user asks about company policies, product specs, or past decisions."` is wildly different from `"Searches docs."`.

If routing is critical, consider adding a tiny in-prompt hint (in the system instruction) that says "prefer calling `send_email` over `create_draft` when the user asks to send immediately." Model-internal routing is good, but explicit guidance beats implicit every time.
