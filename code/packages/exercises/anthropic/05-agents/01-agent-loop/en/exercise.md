# 01 · The Agent Loop

## Concept

An AI agent is not magic: it is a **`while` loop** that sends messages to the API, executes tools when Claude requests them, and repeats until the model signals it is done.

The cycle has three phases:

```
  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │   THINK          ACT            OBSERVE         │
  │                                                 │
  │  Claude        Your code       Claude reads the │
  │  decides what  executes the    result and       │
  │  tool to call  tool locally    decides what to  │
  │                                do next          │
  │                                                 │
  └───────────────────────── (repeat) ─────────────┘
                         ↑
                    stop_reason
                     "end_turn"
                         │
                      DONE ✓
```

The key is the `stop_reason` field in the response:

| `stop_reason` | What to do |
|---|---|
| `"tool_use"` | Execute tools and return results |
| `"end_turn"` | Claude is done — exit the loop |

**Why the iteration cap is mandatory**: an uncapped loop can drain your credits. `maxIterations: 10` is your safety net.

## Goal

Complete the `runAgentLoop(query, maxIterations)` function in `starter.ts` so the agent searches the documentation and answers the user's question.

## Steps

1. Initialize `messages` with the user `query` as a `"user"` message.
2. On each iteration, call `client.messages.create` with `model`, `max_tokens`, `tools` (use `AGENT_TOOLS`), and `messages`.
3. If `stop_reason === "end_turn"` → return the response.
4. If `stop_reason === "tool_use"`:
   - Push the assistant response onto `messages`.
   - For each `tool_use` block, call `executeTool(name, input)` → string.
   - Push a `"user"` message with the corresponding `tool_result` blocks.
5. If the loop exceeds `maxIterations`, throw an error.

## Extra concept

Why build the loop by hand instead of using an agent framework? Because this way you see exactly what bytes travel in each direction. Frameworks like LangChain or Anthropic SDK's `toolRunner` are useful abstractions, but they hide this mechanic. A senior developer knows what happens underneath.

## Tests

The tests verify:
- The number of API calls is between 1 and 10.
- The first request includes the `search_docs` and `read_chunk` tools.
- The model used is Haiku.
- The final call has `stop_reason === "end_turn"`.
- The final response contains at least one text block.
- At least one intermediate call has `stop_reason === "tool_use"`.

```bash
# Run tests against your implementation
AIDEV_TARGET=starter bun test packages/exercises/05-agents/01-agent-loop

# Verify with the solution
AIDEV_TARGET=solution bun test packages/exercises/05-agents/01-agent-loop
```

## Resources

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Implement tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
- [Tool use overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
