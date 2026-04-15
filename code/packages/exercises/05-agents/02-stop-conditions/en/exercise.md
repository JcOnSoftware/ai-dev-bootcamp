# 02 · Stop Conditions

## Concept

When should an agent stop iterating? There are three distinct conditions, in priority order:

| Priority | Condition | Why |
|----------|-----------|-----|
| 1 | `max_iterations` | Safety — never let the agent run forever |
| 2 | `goal` | The agent explicitly signaled it completed its task |
| 3 | `end_turn` | The API says Claude is done (but may not have reached the goal) |

The order matters. An agent that reached `end_turn` but did NOT complete its goal should continue if iterations remain. And an agent that hit the iteration cap must stop even if `stop_reason` is still `"tool_use"`.

**The `evaluateStop` function is pure**: it makes no API calls, has no side effects, and is easy to unit-test.

## Goal

1. Implement `evaluateStop(stopReason, content, iterations, maxIterations)` with the correct priority order.
2. Implement `runWithStopConditions(query, maxIterations)` that returns `{ stoppedReason, calls, finalResponse }`.
3. Include in the `system` prompt an instruction for Claude to signal completion with `"FINAL ANSWER:"`.

## Steps

1. In `evaluateStop`:
   - If `iterations >= maxIterations` → return `"max_iterations"`.
   - If `stop_reason === "end_turn"` and any text block contains `"FINAL ANSWER:"` → return `"goal"`.
   - If `stop_reason === "end_turn"` → return `"end_turn"`.
   - Otherwise → return `null` (keep looping).
2. In `runWithStopConditions`, call `evaluateStop` after each API response and act on the result.
3. The `system` prompt must instruct Claude to start its final response with `"FINAL ANSWER:"`.

## Extra concept

In production, stop conditions get more sophisticated: confidence signals, idempotency checks, wall-clock timeouts. But the pattern is always the same: a pure, testable function that evaluates agent state and decides whether to continue.

## Tests

The tests verify:
- `evaluateStop` works correctly for all 4 cases (no API).
- Call count is between 1 and 10.
- Model is Haiku.
- When forcing `maxIterations: 1`, the agent stops with `stoppedReason === "max_iterations"` in exactly 1 call.

```bash
AIDEV_TARGET=starter bun test packages/exercises/05-agents/02-stop-conditions
AIDEV_TARGET=solution bun test packages/exercises/05-agents/02-stop-conditions
```

## Resources

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Implement tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
