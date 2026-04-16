# Exercise 05 — Tool choice control: auto, required, none

## Concept

By default the model decides whether to call a tool or not (`tool_choice: "auto"`). But sometimes you need to take control. OpenAI exposes three modes via the `tool_choice` parameter:

- **`"auto"`** (default): the model decides whether to use a tool, which one, and with what arguments. The most flexible option.
- **`"required"`**: the model **must** call at least one tool. Useful when you need structured data extraction and don't want the model to respond with free text.
- **`"none"`**: the model **cannot** call any tool, even if you have them defined. Useful for generating plain text in contexts where tools are also available.

You can also force a specific tool with `tool_choice: { type: "function", function: { name: "get_weather" } }`, which guarantees the model uses exactly that function.

```typescript
// Force a specific function
tool_choice: { type: "function", function: { name: "get_weather" } }
```

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — tool_choice section
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — `tool_choice` parameter reference

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client.
3. Define the `get_weather(location: string)` tool.
4. Always use the same message: `"What's the weather in Paris?"`
5. Make **3 API calls** with `model: "gpt-4.1-nano"`, `max_completion_tokens: 256`:
   - Call 1: `tool_choice: "auto"`
   - Call 2: `tool_choice: "required"`
   - Call 3: `tool_choice: "none"`
6. Return `{ autoResult, requiredResult, noneResult }`.

## How to verify

```bash
aidev verify 05-tool-choice-control
```

The tests verify:
- Exactly 3 API calls are made
- The first has `tool_choice: "auto"` (or undefined)
- The second has `tool_choice: "required"`
- The third has `tool_choice: "none"`
- The `"required"` call has `finish_reason: "tool_calls"`
- The `"none"` call has `finish_reason: "stop"` and no tool_calls
- The return has all 3 properties: `autoResult`, `requiredResult`, `noneResult`

## Extra concept (optional)

`tool_choice: "required"` is very useful for **structured data extraction** as an alternative to Structured Outputs. You define a tool whose "result" is the schema you want, send `tool_choice: "required"`, and read the arguments the model constructed — those are your structured data. You don't need to execute anything real: the tool is a "trick" to force the model to generate JSON with the structure you defined.
