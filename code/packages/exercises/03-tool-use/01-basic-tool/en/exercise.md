# 01 — Basic Tool Use

## Objective

Learn how to define a tool and ask Claude to use it, observing the fundamental mechanism:
Claude responds with `stop_reason === "tool_use"` and a `tool_use` content block — not
final text.

---

## Context

Tools are how Claude interacts with the external world. Instead of making up data, Claude
declares that it needs to invoke a function and returns exactly what parameters to use.

The single-turn flow is:

```
you → messages.create(tools, user_message)
Claude → { stop_reason: "tool_use", content: [{ type: "tool_use", name, input }] }
```

In this exercise you only do **the first half**: define the tool and send the message.
Processing the tool result (the "loop") comes in the next exercise.

---

## Your task

1. Define the `get_weather` tool using the JSON schema already in `starter.ts`.
2. Create an Anthropic client and call `messages.create` with:
   - model: `claude-haiku-4-5-20251001`
   - tools: `[GET_WEATHER_TOOL]`
   - a user message asking about the weather in some city
3. Return the response directly (no tool result processing yet).

The `executeGetWeather` function is already exported in the starter — use it to explore,
but it's not needed to pass the tests in this exercise.

---

## Hints

- `input_schema` follows the JSON Schema standard: `type`, `properties`, `required`.
- When Claude decides to use a tool, `response.stop_reason === "tool_use"`.
- The `tool_use` block in `response.content` has: `type`, `id`, `name`, `input`.
- You don't need `tool_choice` here — with `auto` (default) Claude decides on its own.

---

## Success criteria

The tests verify:

- `calls.length === 1` — exactly one API call.
- `calls[0].request.tools` has exactly 1 tool named `"get_weather"`.
- `calls[0].response.stop_reason === "tool_use"`.
- `response.content` contains a block `{ type: "tool_use", name: "get_weather", input: { location: ... } }`.
- The model used contains `"haiku"`.

---

## Resources

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
