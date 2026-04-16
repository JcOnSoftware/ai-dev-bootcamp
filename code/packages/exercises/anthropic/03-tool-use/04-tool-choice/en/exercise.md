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

## Why these tests assert on the request

The tests in this exercise **do not** assert on `response.stop_reason`. Instead, they check:

1. **`calls[i].request.tool_choice` (the shape sent to the API)** — this verifies that YOUR code passed the correct configuration, independently of how the model responds. It's a **code correctness** check, not a **model behavior** check.
2. **Absence of `tool_use` content blocks in the response for the `none` case** — instead of asserting `stop_reason === "end_turn"`.

### Why not use `stop_reason`?

`stop_reason` under `tool_choice: none` **should** be `"end_turn"`, but in practice the model sometimes responds with `"stop_sequence"`, `"max_tokens"`, or even `"tool_use"` due to transient glitches. Asserting on that field is **flake-prone** — tests would break on high-load days even though the learner's code is correct.

Instead, **"no `tool_use` blocks in the response"** is the real semantic meaning of `tool_choice: none`, and it can be verified robustly via `response.content.filter(b => b.type === "tool_use").length === 0`.

> **General rule for LLM API tests**: assert on what YOUR code does (the request shape) or on structural response properties (presence/absence of block types), NEVER on non-deterministic metadata fields like `stop_reason`.

---

## Resources

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
