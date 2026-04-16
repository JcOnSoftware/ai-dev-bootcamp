# Exercise 01 — Define a tool with JSON Schema

## Concept

**Function calling** (also called _tool use_) is the model's ability to tell you it needs to call an external function before it can respond. Instead of making up data it doesn't have, the model says "call this function with these arguments" and waits for the result.

OpenAI implements this via the `tools` parameter in `chat.completions.create`. Each tool is an object with `type: "function"` and a JSON Schema description of what the function does and what parameters it accepts. The model uses that description to decide when and how to call it.

When the model needs a tool, it responds with `finish_reason: "tool_calls"` and the field `choices[0].message.tool_calls` contains an array of calls, each with the function name and arguments as a JSON string. In this exercise you only get as far as that point: define the tool and send the message. The actual execution comes in the next exercise.

```typescript
// The response has NO text — it has tool_calls
const toolCall = response.choices[0].message.tool_calls?.[0];
// toolCall.function.name === "get_weather"
// toolCall.function.arguments === '{"location":"Tokyo, Japan","unit":"celsius"}'
```

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — official guide covering the full cycle
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — reference for the `tools` parameter

## Your task

1. Open `starter.ts`.
2. Create an OpenAI client.
3. Call `client.chat.completions.create` with:
   - `model: "gpt-4.1-nano"`, `max_completion_tokens: 256`
   - `messages: [{ role: "user", content: "What's the weather in Tokyo?" }]`
   - `tools`: an array with a single tool of type `"function"` named `get_weather`
     - `description`: `"Get the current weather for a location"`
     - `parameters`: JSON Schema with `type: "object"` and properties:
       - `location` (string, required): city and country
       - `unit` (string, enum `["celsius", "fahrenheit"]`): temperature unit
4. Return the response directly. **Do not execute the tool yet.**

## How to verify

```bash
aidev verify 01-json-schema-tools
```

The tests verify:
- Exactly 1 API call is made
- The request includes a `tools` array with at least 1 element
- The first tool has `type: "function"`
- The function name is `"get_weather"`
- The function has a `parameters` object
- The response `finish_reason` is `"tool_calls"`
- The response has `tool_calls` with at least 1 entry
- The tool call references the `get_weather` function

## Extra concept (optional)

The JSON Schema in `parameters` can be as rich as you need. You can use `description` on each property (highly recommended — the model reads them for context), `enum` for constrained values, `type: "array"`, nested `type: "object"`, and `$defs` for reuse. The clearer the description, the better the model decides when and how to call the function.
