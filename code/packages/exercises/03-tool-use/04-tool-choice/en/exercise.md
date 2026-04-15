# 04 — Tool Choice

## Objective

Understand how to control whether Claude uses tools and which ones, via the `tool_choice`
parameter. Observe the four available options and when to use each.

---

## Context

By default, Claude freely chooses whether to use a tool (`tool_choice: auto`). But you
can force its behavior with four modes:

| Value | Behavior |
|-------|----------|
| `{ type: "auto" }` | Claude decides (default). May use a tool or respond in text. |
| `{ type: "any" }` | Claude MUST use at least one tool. |
| `{ type: "tool", name: "X" }` | Claude MUST use exactly tool `X`. |
| `{ type: "none" }` | Claude CANNOT use any tool — responds in text. |

This exercise makes 4 sequential calls with the same prompt but different `tool_choice`,
so you can see each mode's behavior side by side.

---

## Your task

Implement `run()` that makes 4 **sequential** (not parallel) calls with the same prompt
`"What is 12 times 15?"` and both tools, varying `tool_choice`:

1. Without `tool_choice` (or `{ type: "auto" }`) → result in `auto`
2. `{ type: "any" }` → result in `any`
3. `{ type: "tool", name: "calculate" }` → result in `named`
4. `{ type: "none" }` → result in `none`

Return `{ auto, any, named, none }`.

Important: make the calls **sequentially** (not `Promise.all`) so the harness captures
them in the correct order.

---

## Hints

- `tool_choice` is passed at the same level as `tools` in `messages.create`.
- With `type: "none"`, `response.content` will have no `tool_use` blocks.
- With `type: "tool"`, `response.stop_reason === "tool_use"` is guaranteed.
- The return type can be `Promise<{ auto: Message, any: Message, named: Message, none: Message }>`.

---

## Success criteria

- `calls.length === 4`.
- `calls[0].request.tool_choice` is `undefined` or `{ type: "auto" }`.
- `calls[1].request.tool_choice` is `{ type: "any" }`.
- `calls[2].request.tool_choice` is `{ type: "tool", name: "calculate" }`.
- `calls[2].response.content` contains a `tool_use` block with `name === "calculate"`.
- `calls[3].request.tool_choice` is `{ type: "none" }`.
- `calls[3].response.content` has NO `tool_use` blocks.
- Model is haiku.

---

## Resources

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
