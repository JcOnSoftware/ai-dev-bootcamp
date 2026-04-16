# 01-basic-caching — First call with prompt caching

## Concept

Claude's **prompt caching** lets you "pin" part of the context in the API so it doesn't need to be transmitted or processed on every request. Instead of paying the full input price per call, the second request that includes the same cached block pays only **0.1× the input price** — a 90 % saving.

For caching to activate, the system block must exceed the minimum threshold of **4,096 tokens** on Haiku 4.5. This exercise uses a ~4,300-token technical document that already clears that threshold.

Basic flow:
- Call 1: `cache_creation_input_tokens > 0` (cache is written for the first time)
- Call 2: `cache_read_input_tokens > 0` (cache is read — 0.1× price)

The default cache TTL is **5 minutes** (ephemeral mode).

## Docs & references

- Main guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
- Messages API reference: https://docs.claude.com/en/api/messages

## Your task

1. Import `LONG_SYSTEM_PROMPT` from `../fixtures/long-system-prompt.ts`.
2. Build a system block with `type: "text"`, `text: LONG_SYSTEM_PROMPT`, and `cache_control: { type: "ephemeral" }`.
3. Make **two sequential calls** to `client.messages.create` using the same system block.
4. Use model `claude-haiku-4-5-20251001` and `max_tokens: 256`.
5. Return both responses from `run()`.

## How to verify

```bash
# Run against the solution (real integration):
aidev verify 01-basic-caching --solution

# Run your implementation:
aidev verify 01-basic-caching

# Inspect output in detail:
aidev run 01-basic-caching --solution --full
```

The tests verify:
- `result.calls` has exactly 2 elements.
- Both requests include `cache_control: { type: "ephemeral" }` on the system block.
- Call 1 shows cache activity (creation or read tokens > 0).
- Call 2 has `cache_read_input_tokens > 0`.
- Both responses contain at least one text block.
- Both use a Haiku model.

## Extra concept

**Why is the cache sometimes already warm on the first call?**

Anthropic's cache is **server-side** and persists for 5 minutes from the last read. If you run this exercise several times in a session, the first call may find the cache already warm and show `cache_read_input_tokens > 0` instead of `cache_creation_input_tokens > 0`. This is correct behavior — the tests account for it.

In production, this is desirable: multiple requests from different users sharing the same system prompt all benefit from the same server-side cache.
