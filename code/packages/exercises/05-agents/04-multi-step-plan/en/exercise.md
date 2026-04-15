# 04 · Multi-Step Planning

## Concept

An agent receiving a complex question can try to answer it with a single search — or it can **plan** and break it into simpler sub-questions. The difference is entirely in the `system` prompt.

The `system` prompt is the most important architectural lever for agents: it defines how the model thinks before it acts.

Without a planning instruction:
- Claude may do 1 generic search and synthesize with whatever it finds.

With a planning instruction:
- Claude breaks the question into sub-questions.
- Searches for each one separately.
- Synthesizes all results at the end.

The result is much more accurate and reliable.

## Goal

Implement `runMultiStepAgent(query, maxIterations)` with a `system` prompt that explicitly instructs Claude to plan its steps.

## Steps

1. Define a `system` prompt containing instructions like:
   - "Break the question into sub-questions before searching."
   - "Search for each sub-question separately."
   - "Synthesize all findings at the end."
2. Implement the agent loop exactly as in exercise 01 — the only difference is the `system` prompt.
3. Pass `system` to `client.messages.create`.

## Extra concept

System prompt engineering is real engineering. Changing "answer the question" to "plan your steps before searching" fundamentally changes agent behavior. Measuring the effect (number of searches, answer quality) is part of the craft.

## Tests

The tests verify:
- At least 2 API calls.
- The `system` prompt contains a planning instruction ("plan", "step", "break", "sub-question").
- At least 2 distinct `search_docs` queries across the execution.
- The final answer mentions cache write cost (25% more expensive) and cache read savings (10% of base cost).

```bash
AIDEV_TARGET=starter bun test packages/exercises/05-agents/04-multi-step-plan
AIDEV_TARGET=solution bun test packages/exercises/05-agents/04-multi-step-plan
```

## Resources

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Prompt engineering overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)
- [Tool use overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
