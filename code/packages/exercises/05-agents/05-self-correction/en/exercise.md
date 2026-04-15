# 05 · Self-Correction

## Concept

Production agents encounter errors: non-existent IDs, downed APIs, malformed responses. A robust agent doesn't give up — it **detects the error and tries a different strategy**.

The `read_chunk` tool returns `{ error: "Chunk not found: ..." }` when the ID doesn't exist. If the agent retries with the same ID, it enters a useless loop. The solution is to explicitly instruct the model to change approach on error.

**Mechanism**: the `system` prompt includes the rule:
> "If any tool returns `{ error }`, you MUST try a DIFFERENT approach rather than retrying the same call."

This instruction is enough for Claude to detect the error JSON in the `tool_result` and revise its plan.

## Goal

Implement `runSelfCorrecting(query, maxIterations)` with a `system` prompt that instructs error recovery. The `run()` query asks to read `"nonexistent-id"` first, forcing the agent to encounter an error and then find a valid alternative.

## Steps

1. Define the `system` prompt with the explicit error rule.
2. Implement the agent loop exactly as in previous exercises.
3. `executeTool` already returns `{ error: ... }` automatically for non-existent IDs — no special code needed.

## Extra concept

**`disable_parallel_tool_use`**: if you want errors to be predictable and sequential, you can add `disable_parallel_tool_use: true` to the request. This forces Claude to call one tool at a time, making the first `read_chunk` error propagate before it tries more tools. Useful for debugging and flows where order matters.

The Anthropic SDK also has `beta.messages.toolRunner()` that handles the loop for you — but as we saw in exercise 01, building it by hand gives you full control over error handling and recovery.

## Tests

The tests verify:
- At least 2 API calls.
- The `system` prompt contains error-handling instruction ("error" + "different"/"another"/"try").
- At least one `tool_result` in the conversation contains `{"error":` (recovery was triggered).
- `read_chunk` was called with at least 2 distinct IDs (the failed one and the recovery one).
- Final response is `end_turn` with text.

```bash
AIDEV_TARGET=starter bun test packages/exercises/05-agents/05-self-correction
AIDEV_TARGET=solution bun test packages/exercises/05-agents/05-self-correction
```

## Resources

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Tool results and errors](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
- [Tool use overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
