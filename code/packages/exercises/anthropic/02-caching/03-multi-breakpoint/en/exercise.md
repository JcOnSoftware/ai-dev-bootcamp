# 03-multi-breakpoint — Multiple cache breakpoints

## Concept

Claude supports up to **4 cache breakpoints** per request. Each `cache_control: { type: "ephemeral" }` you place tells the API: "cache the entire prefix up to this point". The three locations where you can place breakpoints are:

1. **System block** (`system[]`) — cache the system prompt
2. **Last tool in the array** (`tools[]`) — cache system + all tools up to the marked one
3. **Content block in prior messages** (`messages[].content[]`) — cache conversation history

Using all three simultaneously maximizes savings in multi-turn conversations where context grows with each turn.

**Hard limit**: never exceed 4 breakpoints. The 5th is silently ignored (Anthropic drops the oldest one). Always document the breakpoint count in your code.

## Docs & references

- Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Cache breakpoints and limits: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#cache-limitations-and-considerations
- Tool use guide: https://docs.claude.com/en/docs/build-with-claude/tool-use

## Your task

1. Define at least 2 tools; add `cache_control: { type: "ephemeral" }` to the **last** tool in the array (breakpoint 2).
2. Use `LONG_SYSTEM_PROMPT` as a cached system block (breakpoint 1).
3. Make **call 1** (warmup) — no assistant history yet.
4. Take the response 1 content and add `cache_control` to the **last content block** of the assistant turn (breakpoint 3).
5. If response 1 includes `tool_use` blocks, you must include the corresponding `tool_result` blocks in turn 2 before continuing the conversation.
6. Make **call 2** with the cached history.
7. Return both responses.

## How to verify

```bash
aidev verify 03-multi-breakpoint --solution
aidev verify 03-multi-breakpoint
aidev run 03-multi-breakpoint --solution --full
```

The tests verify:
- `result.calls` has 2 elements.
- Call 1 has at least one system block with `cache_control.type === "ephemeral"`.
- Call 2 has a `tools` array where the last tool has `cache_control`.
- Total `cache_control` blocks in call 2 is between 2 and 4 (never > 4).
- Call 2 has `cache_read_input_tokens > 0`.
- Both requests use a Haiku model.

## Extra concept

**Cache invalidation order**

The cache works like prefixes of a tree. If you modify a block earlier in the sequence, all subsequent breakpoints are invalidated:

```
[system BP1] → [tools BP2] → [messages BP3]
     ↓               ↓              ↓
Change BP1    invalidates BP2   invalidates BP3
Change BP2    (BP1 intact)      invalidates BP3
Change BP3    (BP1+BP2 intact)
```

This is why you always place content that changes least at the beginning (system), and content that changes most at the end (message history). This rule applies to Anthropic prompt caching as well as the KV caches of most other LLMs.
