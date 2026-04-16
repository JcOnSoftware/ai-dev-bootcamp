# 05-caching-with-tools — Caching with tool use

## Concept

Prompt caching works especially well with tool use because the combination of `system prompt + tool definitions` can be long (thousands of tokens) and repeats on every turn of the conversation. By caching both together, every call after the first pays only 0.1× for all that context.

The pattern is:
- **Breakpoint 1**: system block (LONG_SYSTEM_PROMPT)
- **Breakpoint 2**: last tool in the array (caches system + tools as a single prefix)

In a multi-turn tool-use conversation, the typical flow is:
1. Turn 1: user → Claude uses tool → `tool_use` block in the response
2. Turn 2: user sends `tool_result` + next message → Claude responds with cache_read > 0

The message history grows with each turn, but the system and tools remain the same cached prefix.

## Docs & references

- Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Tool use guide: https://docs.claude.com/en/docs/build-with-claude/tool-use
- Multi-turn with tool results: https://docs.claude.com/en/docs/build-with-claude/tool-use#handling-tool-use-and-tool-results

## Your task

1. Define at least 1 tool. Add `cache_control: { type: "ephemeral" }` to the **last** tool in the array (breakpoint 2).
2. Use `LONG_SYSTEM_PROMPT` as a cached system block (breakpoint 1).
3. **Turn 1**: send a user message that invites tool use. Claude responds with a `tool_use` block.
4. Extract the tool use block from response 1.
5. **Turn 2**: send `tool_result` (with the `tool_use_id` from step 4) + a follow-up message. Claude should read from cache.
6. Return both responses.

Tip: to force Claude to use a tool on turn 1, use `tool_choice: { type: "any" }`.

## How to verify

```bash
aidev verify 05-caching-with-tools --solution
aidev verify 05-caching-with-tools
aidev run 05-caching-with-tools --solution --full
```

The tests verify:
- `result.calls` has 2 elements.
- Call 1 has system with `cache_control.type === "ephemeral"`.
- Call 1 has tools with the last tool having `cache_control`.
- Call 1 response contains at least one `tool_use` block.
- Call 2 has tools with `cache_control` on the last tool.
- Call 2 has `cache_read_input_tokens > 0`.
- Both requests use a Haiku model.

## Extra concept

**Why cache tool definitions?**

Tools are expressed as JSON schemas that can occupy several hundred tokens each. In an agent with 10-15 tools, the definitions alone can be 2,000-3,000 tokens. If you run 1,000 conversations per day, caching the tools can represent an 80-90% saving on input tokens for every turn.

The caching-with-tools pattern is one of the most impactful in production because:
1. Tool definitions almost never change (unlike message history)
2. They repeat on EVERY turn of the conversation
3. They accumulate with the system prompt to form a long, stable prefix

This makes the system + tools combination the perfect candidate for an aggressive cache breakpoint.
