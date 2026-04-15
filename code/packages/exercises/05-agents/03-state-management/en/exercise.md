# 03 · State Management

## Concept

The Anthropic API is **stateless**: every request must include the complete conversation history. There is no server-side session to resume. Your code owns the state.

This has important implications:

- The `messages` array grows with each turn — you need to accumulate it correctly.
- Appending the assistant's response to the history is mandatory before starting the next turn.
- If you forget to include prior history, Claude "forgets" everything that happened before.

A **turn** in this context is a user question answered completely (may require multiple internal API calls to resolve tool uses). The messages array is mutated in-place to accumulate history across turns.

## Goal

Implement `runTurn(state, userMsg, maxIterations)` that:
1. Appends the user message to state.
2. Runs the agent loop until `end_turn`.
3. Appends the final assistant response to state (for the next turn).
4. Returns the final response.

## Steps

1. Define `ConversationState` with `messages: Anthropic.MessageParam[]` and `totalIterations: number`.
2. In `runTurn`, do `state.messages.push({ role: "user", content: userMsg })`.
3. Run the agent loop using `state.messages` as context (same as exercise 01, but with accumulated history).
4. Before returning the final response, append the assistant's response to state: `state.messages.push({ role: "assistant", content: response.content })`.
5. In `run()`, create the initial state and call `runTurn` twice with related questions.

## Extra concept

In real applications, conversation state is serialized (JSON, database) to survive between HTTP requests. The pattern is the same: a flat array of messages that grows monotonically. Memory management (truncation, summaries) comes later.

## Tests

The tests verify:
- At least 2 API calls (2 turns).
- Total call count is between 2 and 15.
- The second turn includes messages from the first (accumulated history).
- The last request has at least 4 messages.
- Final response is `end_turn` with text.

```bash
AIDEV_TARGET=starter bun test packages/exercises/05-agents/03-state-management
AIDEV_TARGET=solution bun test packages/exercises/05-agents/03-state-management
```

## Resources

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Implement tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
- [Messages API reference](https://docs.claude.com/en/api/messages)
