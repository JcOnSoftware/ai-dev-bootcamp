# Exercise 03 — Maintain state across agent iterations

## Concept

The messages history is the agent's implicit memory, but sometimes you need **explicit state** — data the agent modifies through its actions and that persists beyond the conversation context. Think of it as the difference between remembering what you said (conversational memory) vs. having a notebook where you write things down (external state).

In this exercise the agent will use a tool to add notes to an array and to list them. That array lives in your code, not in the model — the model only interacts with it through tools. This separation is fundamental: **the model reasons, tools mutate state, your code orchestrates everything**.

This pattern is the foundation of more complex agents: a database, a file system, a task queue — all can be "external state" that the agent reads and modifies through tools. The immutability of the messages history combined with the mutability of external state is a very powerful architecture.

```typescript
// External state — mutable, persists across iterations
const notes: string[] = [];

// Tool executor — mutates state based on model requests
if (args.action === "add_note") {
  notes.push(args.text);
  return { success: true };
}
```

## Docs & references

1. [Node.js SDK](https://github.com/openai/openai-node) — OpenAI client setup and usage
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — how to design tools that mutate external state
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — tool parameter reference with `enum` in the schema

## Your task

1. Open `starter.ts`.
2. Create a mutable `notes: string[]` array — the agent's external state.
3. Create an OpenAI client and a `messages` array with: `{ role: "user", content: "Take a note that I need to buy milk, then take a note about the meeting at 3pm, then list all notes." }`.
4. Define the `note_taker` tool with parameter `action: "add_note" | "list_notes"` and `text?: string`.
5. Implement the agent loop. When the tool is executed:
   - If `action === "add_note"`: push `text` into the `notes` array, return `{ success: true, note: text }`.
   - If `action === "list_notes"`: return `{ notes }`.
6. Increment `turnCount` each time you process tool calls.
7. Return `{ notes, turnCount }`.

## How to verify

```bash
aidev verify 03-state-management
```

The tests verify:
- At least 3 API calls were made
- `notes` is an array with at least 2 entries
- `turnCount` >= 2
- The last call has `finish_reason: "stop"`

## Extra concept (optional)

In production agents, external state typically lives in a database, not in memory. This enables: (1) persisting state across sessions, (2) sharing state between multiple agent instances, (3) auditing changes. Tools like LangGraph model this explicitly with a "state graph" where each node transitions the state according to defined rules. The concept is the same as this exercise, just more formalized.
