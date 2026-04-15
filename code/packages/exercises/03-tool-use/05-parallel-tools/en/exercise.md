# 05 — Parallel Tools

## Objective

Correctly handle the case where Claude calls the same tool multiple times in parallel
(in a single turn), providing all `tool_result` blocks in a single return message.

---

## Context

Claude can emit multiple `tool_use` blocks in a single response when the prompt asks
for information from several resources simultaneously. For example, if you ask for the
weather in 3 cities, Claude may emit 3 `tool_use` blocks in `response1.content`.

If you only respond to the first and ignore the rest, the API returns a validation error.
**All** `tool_use_id`s from turn 1 must have a corresponding `tool_result` in the turn 2 message.

```
call 1 response.content:
  [text?, tool_use{id:"A", location:"London"}, tool_use{id:"B", location:"Tokyo"}]

call 2 user message content:
  [tool_result{id:"A", ...}, tool_result{id:"B", ...}]
```

The actual behavior is non-deterministic — Haiku may decide to call the tool 1, 2, or
more times depending on the model version. Tests accept `>= 1` tool_use blocks.

---

## Your task

1. Implement `executeGetWeather(input)` — returns JSON with temperature and description.
2. Implement `run()`:
   - **Turn 1**: Call with a prompt that explicitly asks for weather in multiple cities.
     Use `tool_choice: { type: "any" }` to force tool usage.
   - **Collect ALL** `tool_use` blocks from `response1.content` using `.filter()`.
   - For each `tool_use` block, create a `{ type: "tool_result", tool_use_id, content }`.
   - **Turn 2**: Send all `tool_result` blocks in a single `user` message.
3. Return `response2`.

---

## Hints

- Use `.filter(b => b.type === "tool_use")` — not `.find()` — to capture all blocks.
- The `content` of the turn 2 `user` message is an array of `tool_result` blocks.
- If Claude only calls the tool once, your code should still work correctly.
- Tests verify that `toolResultBlocks.length === toolUseBlocks.length`.

---

## Success criteria

- `calls.length === 2`.
- `calls[0].response.content.filter(b => b.type === "tool_use").length >= 1`.
- The last `user` message in `calls[1]` contains exactly as many `tool_result` blocks
  as there were `tool_use` blocks in turn 1.
- All `tool_use_id`s from turn 1 are present in the `tool_result` blocks of turn 2.
- `calls[1].response.stop_reason === "end_turn"`.
- Model is haiku.

---

## Resources

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
