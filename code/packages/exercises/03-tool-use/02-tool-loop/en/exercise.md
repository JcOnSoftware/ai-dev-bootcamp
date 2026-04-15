# 02 — Tool Loop

## Objective

Complete the tool use cycle: process Claude's response containing a `tool_use` block,
execute the function locally, and feed the result back to Claude in a second turn to
get the final text response.

---

## Context

In the previous exercise, Claude responded with `stop_reason === "tool_use"` — but you
stopped there. Claude is "waiting" for you to give it the tool result.

The complete two-turn flow is:

```
you → call 1: messages.create(tools, user_message)
Claude → { stop_reason: "tool_use", content: [..., { type: "tool_use", id, name, input }] }
you → call 2: messages.create(history + tool_result)
Claude → { stop_reason: "end_turn", content: [{ type: "text", text: "..." }] }
```

The key is building the third message (the one containing `tool_result`) correctly:
it must include the `tool_use_id` that Claude returned in turn 1.

---

## Your task

1. Implement `executeGetWeather` — receives `{ location, unit? }` and returns a JSON
   string with temperature and description (you can hardcode reasonable values).
2. Implement `run()` with the 2-turn loop:
   - **Turn 1**: `messages.create` with tools + user message.
   - Extract the `tool_use` block from `response1.content` with `Array.find`.
   - Call `executeGetWeather` with `toolUseBlock.input`.
   - **Turn 2**: `messages.create` with full history + a `user` message containing
     `[{ type: "tool_result", tool_use_id: toolUseBlock.id, content: result }]`.
3. Return `response2`.

---

## Hints

- The history for turn 2 is: `[userMessage, { role: "assistant", content: response1.content }, { role: "user", content: [toolResult] }]`.
- `tool_use_id` must match exactly with `toolUseBlock.id` — Claude uses it to know which call the result belongs to.
- If Claude calls a tool you don't recognize, throw an informative error.
- Turn 2 doesn't need `tool_choice` — Claude knows it already received the result.

---

## Success criteria

The tests verify:

- `executeGetWeather` returns a JSON string with a numeric `temperature` (unit test, no API).
- `calls.length === 2` — exactly two API calls.
- `calls[0].response.content` contains a `tool_use` block.
- The last `user` message in `calls[1].request.messages` contains a `tool_result`
  whose `tool_use_id` matches the `id` of the `tool_use` block from turn 1.
- `calls[1].response.stop_reason === "end_turn"`.
- The model is haiku.

---

## Resources

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
