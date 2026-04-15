# Spec: add-agents-track

Change: `add-agents-track`
Track slug: `05-agents`
Generation model: `claude-haiku-4-5-20251001`
Status: spec
Date: 2026-04-15

---

## Shared fixture contract

**Path**: `code/packages/exercises/05-agents/fixtures/research-tools.ts`

```ts
import { DOCS_CHUNKS, type Chunk } from "../../04-rag/fixtures/docs-chunks.ts";

export const SEARCH_DOCS_TOOL: ToolDefinition;
export const READ_CHUNK_TOOL: ToolDefinition;
export const AGENT_TOOLS: [typeof SEARCH_DOCS_TOOL, typeof READ_CHUNK_TOOL];

export function executeSearchDocs(input: { query: string; top_k?: number }): string;
export function executeReadChunk(input: { id: string }): string;
export function executeTool(name: string, input: unknown): string;
```

**DOCS_CHUNKS field shape** (confirmed from `04-rag/fixtures/docs-chunks.ts`):

```ts
interface Chunk {
  id: string;           // e.g. "caching-01", "tooluse-03"
  text: string;         // 150–300 tokens — field is `.text`, NOT `.content`
  metadata: {
    source: "prompt-caching-docs" | "tool-use-docs";
    topic: string;      // e.g. "cache-ttl", "tool-loop"
    url: string;
  };
}
```

**Tool definition requirements**:

- `SEARCH_DOCS_TOOL` description MUST mention it returns chunk ids + topic metadata (NOT full content). Tool name: `search_docs`. Input schema properties: `query` (string, required), `top_k` (number, optional, default 3).
- `READ_CHUNK_TOOL` description MUST mention it returns the full text of a chunk by id. Tool name: `read_chunk`. Input schema properties: `id` (string, required).
- `AGENT_TOOLS` is a tuple `[SEARCH_DOCS_TOOL, READ_CHUNK_TOOL]` — used verbatim in `tools:` array of every exercise.

**Implementation requirements**:

- `executeSearchDocs`: case-insensitive substring match on `chunk.text` AND `chunk.metadata.topic`. Default `top_k: 3`. Returns JSON string of `[{ id, topic, source }, ...]` (metadata summary only — no `.text` in results).
- `executeReadChunk`: returns `JSON.stringify({ id, content: chunk.text, metadata })`. If id not found, returns `JSON.stringify({ error: "Chunk not found: <id>" })`.
- `executeTool`: routes by `name` to `executeSearchDocs` or `executeReadChunk`. Unknown name returns `JSON.stringify({ error: "Unknown tool: <name>" })`. Casts `input as` appropriate type for each branch.

---

## Helper / API contract per exercise

### `01-agent-loop` — basic loop

**Goal**: Implement the canonical think→act→observe loop until `end_turn` or `maxIterations`.

**Exports**:

```ts
export async function runAgentLoop(
  userQuery: string,
  maxIterations?: number   // default 10
): Promise<{ finalMessage: Anthropic.Message; iterations: number }>;

export default async function run(): Promise<{ finalMessage: Anthropic.Message; iterations: number }>;
// run() calls: runAgentLoop("What's the TTL for prompt caching?", 10)
```

**Internal behavior required**:

1. Build initial `messages: Anthropic.MessageParam[]` with the user query.
2. Include `AGENT_TOOLS` in every `messages.create` call.
3. Model: `claude-haiku-4-5-20251001`. System prompt must instruct Claude to use the tools provided to answer questions about Anthropic docs.
4. While loop:
   - Send `messages.create({ model, system, tools, messages })`.
   - Increment `iterations`.
   - If `stop_reason === "end_turn"`: break, return `{ finalMessage, iterations }`.
   - If any content block has `type === "tool_use"`: execute via `executeTool`, append assistant message + `tool_result` user message to `messages`, continue.
   - If `iterations >= maxIterations`: break and return (hard cap).

**Assertions — integration (real API)**:

- `result.calls.length >= 1 && result.calls.length <= 10`
- `result.calls[0].request.tools.length === 2`
- `result.calls[0].request.tools` contains entries with `name === "search_docs"` and `name === "read_chunk"`
- `result.calls[0].request.model` matches `/haiku/i`
- `result.calls[result.calls.length - 1].response.stop_reason === "end_turn"`
- `result.userReturn.iterations >= 1 && result.userReturn.iterations <= 10`
- `result.userReturn.finalMessage.content` has at least one block where `b.type === "text"`

---

### `02-stop-conditions` — layered termination

**Goal**: Implement three stop conditions in a single loop and understand when to use each.

**Exports**:

```ts
export async function runWithStopConditions(
  userQuery: string,
  options: {
    maxIterations: number;
    goalPredicate?: (msg: Anthropic.Message) => boolean;
  }
): Promise<{
  stoppedReason: "end_turn" | "max_iterations" | "goal_reached";
  iterations: number;
  finalMessage: Anthropic.Message;
}>;

export default async function run(): Promise<{
  stoppedReason: "end_turn" | "max_iterations" | "goal_reached";
  iterations: number;
  finalMessage: Anthropic.Message;
}>;
// run() demonstrates goal_reached: passes a goalPredicate that checks whether the
// response text contains "5 minutes" or "5-minute" (case-insensitive).
// Query: "What is the TTL for prompt caching?"
```

**Internal behavior required** (check order per iteration: goal → end_turn → cap):

1. After each `messages.create` response:
   a. If `goalPredicate` is defined and `goalPredicate(response) === true` → return `stoppedReason: "goal_reached"`.
   b. If `stop_reason === "end_turn"` → return `stoppedReason: "end_turn"`.
   c. If content contains `tool_use` blocks → execute tools, push messages, continue.
   d. If `iterations >= maxIterations` → return `stoppedReason: "max_iterations"`.

**Optional pure unit test block** (no API — use a mock helper):

Expose an internal pure function:
```ts
export function evaluateStop(
  message: Anthropic.Message,
  iteration: number,
  maxIterations: number,
  goalPredicate?: (msg: Anthropic.Message) => boolean
): "end_turn" | "max_iterations" | "goal_reached" | "continue"
```

Unit `describe` block tests 3 scenarios:
- Mock message with `stop_reason: "end_turn"`, no tool_use → returns `"end_turn"`.
- Mock message with `stop_reason: "tool_use"`, `iteration >= maxIterations` → returns `"max_iterations"`.
- Mock message with any stop_reason, `goalPredicate` returns `true` → returns `"goal_reached"`.
- Mock message with `stop_reason: "tool_use"`, iteration < max, no goal → returns `"continue"`.

**Assertions — integration (real API)**:

- `run()` returns object with exactly the fields `stoppedReason`, `iterations`, `finalMessage`.
- `result.userReturn.stoppedReason` is one of `"end_turn" | "max_iterations" | "goal_reached"`.
- `result.userReturn.iterations >= 1 && result.userReturn.iterations <= 10`.
- At least one integration test demonstrates a non-`end_turn` stop reason (pass `maxIterations: 1` in a second test to force `max_iterations`).

---

### `03-state-management` — conversation state

**Goal**: Understand that conversation state lives OUTSIDE the model. Implement explicit state threading.

**Exports**:

```ts
export interface ConversationState {
  messages: Anthropic.MessageParam[];
  metadata: {
    totalIterations: number;
    startedAt: string;   // ISO 8601 timestamp from Date.toISOString()
  };
}

export function startConversation(): ConversationState;
// Returns: { messages: [], metadata: { totalIterations: 0, startedAt: new Date().toISOString() } }

export async function continueConversation(
  state: ConversationState,
  userMessage: string
): Promise<{ state: ConversationState; reply: Anthropic.Message }>;
// Runs ONE agent loop iteration (until end_turn for this turn).
// Appends userMessage to state.messages, runs loop until end_turn (or maxIterations: 10),
// accumulates all messages into state.messages, increments totalIterations by loop count.
// Returns updated state + final reply message.

export default async function run(): Promise<{
  state: ConversationState;
  reply: Anthropic.Message;
}>;
```

**`run()` behavior** — 2-turn conversation:

1. `state = startConversation()`
2. `{ state, reply } = await continueConversation(state, "What's the TTL default for prompt caching?")`
3. `{ state, reply } = await continueConversation(state, "And the extended TTL option?")`
   - Turn 2 deliberately uses "the extended" — only resolvable with conversation history.
4. Returns `{ state, reply }` from turn 2.

**Assertions — integration (real API)**:

- `result.userReturn.state.messages.length >= 4` (2 user + ≥2 assistant messages; tool_use/tool_result blocks may inflate this further).
- The last assistant reply's content has at least one `type === "text"` block with `.text.length > 20`.
- `result.userReturn.state.metadata.totalIterations >= 2 && <= 15`.
- The final user message in `state.messages` satisfies `m.role === "user" && (typeof m.content === "string" ? m.content : (m.content as Anthropic.ContentBlockParam[]).find(b => b.type === "text")?.text) === "And the extended TTL option?"`.

---

### `04-multi-step-plan` — task decomposition

**Goal**: Learn how system prompt engineering steers the model toward planning before acting.

**Exports**:

```ts
export async function runMultiStepPlan(
  userQuery: string,
  maxIterations?: number   // default 10
): Promise<{
  finalAnswer: string;
  toolCallsMade: { name: string; input: unknown }[];
  iterations: number;
}>;

export default async function run(): Promise<{
  finalAnswer: string;
  toolCallsMade: { name: string; input: unknown }[];
  iterations: number;
}>;
// run() query: "Compare the cost multipliers for 5-minute vs 1-hour prompt caching.
//               Give me both numbers side by side."
```

**Required system prompt hint** (pedagogical — learner must implement this):

The system prompt MUST contain explicit planning instructions such as: "Before answering, plan your steps. Search for each piece of information separately, then synthesize a final answer." This demonstrates prompt engineering for task decomposition.

**Internal behavior**: Same DIY loop as 01. Accumulate `toolCallsMade` by collecting every `tool_use` content block's `{ name, input }` pair across all iterations.

**Assertions — integration (real API)**:

- `result.userReturn.iterations >= 2 && result.userReturn.iterations <= 10`.
- `result.userReturn.toolCallsMade.length >= 2`.
- At least 2 entries in `toolCallsMade` have `name === "search_docs"`.
- Those 2+ `search_docs` entries have DISTINCT `input.query` values (normalize: `.toLowerCase().trim()`, assert `queryA !== queryB`).
- `result.userReturn.finalAnswer.length > 50`.
- Soft semantic check: `finalAnswer` matches `/(1\.25|1\.25x|1\.25×|25%).*?(2x|2×|×2|double|200%|two times)|(2x|2×|×2|double|200%|two times).*?(1\.25|1\.25x|1\.25×|25%)/i` OR contains both `"1.25"` and `"2"` as substrings. Accept any formatting of the two multipliers.

---

### `05-self-correction` — failure recovery

**Goal**: Observe error propagation through tool results and implement recovery via system prompt.

**Exports**:

```ts
export async function runWithSelfCorrection(
  userQuery: string,
  maxIterations?: number   // default 10
): Promise<{
  finalMessage: Anthropic.Message;
  retries: number;
  iterations: number;
}>;

export default async function run(): Promise<{
  finalMessage: Anthropic.Message;
  retries: number;
  iterations: number;
}>;
// run() query: "Read chunk 'nonexistent-id' and summarize it.
//               If that chunk doesn't exist, try 'caching-01' instead."
```

**Required system prompt instruction** (non-negotiable — spec-level requirement):

```
"If any tool returns { error }, try a DIFFERENT approach rather than retrying the same call."
```

**Internal behavior**:

- Same DIY loop as 01.
- Track `retries`: increment each time a `tool_result` returned by `executeTool` contains the string `"error"` in its JSON.
- `retries` is a count of error-containing tool results observed, not a loop counter.

**Expected agent behavior** (driven by query + system prompt):

1. Agent calls `read_chunk({ id: "nonexistent-id" })` → receives `{ error: "Chunk not found: nonexistent-id" }`.
2. System prompt triggers recovery: agent calls `read_chunk({ id: "caching-01" })` (or similar valid id from the user prompt) → success.
3. Agent synthesizes final answer and returns `end_turn`.

**Assertions — integration (real API)**:

- `result.userReturn.retries >= 1`.
- `result.userReturn.iterations >= 2 && result.userReturn.iterations <= 10`.
- Tool call history across all `result.calls` contains at least 2 `read_chunk` tool_use blocks with DIFFERENT `input.id` values.
  - Specifically: one `id` matching `"nonexistent-id"` and at least one valid id (e.g. `"caching-01"` or any id present in `DOCS_CHUNKS`).
- `result.userReturn.finalMessage.content` has at least one `type === "text"` block with `.text.length > 30`.

**`## Concepto extra`** in exercise.md: brief mention of `disable_parallel_tool_use: true` — when to force sequential tool calls to make error propagation predictable.

---

## Starter contract

Each `starter.ts`:

1. Begins with a `// Docs:` comment block with canonical URLs:

```ts
// Docs:
//   Tool use overview        : https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Implement tool use       : https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use
```

2. Imports from `../fixtures/research-tools.ts`:

```ts
import { AGENT_TOOLS, executeTool } from "../fixtures/research-tools.ts";
import Anthropic from "@anthropic-ai/sdk";
```

3. Exports all named helpers as TODO-throwing stubs with correct signatures:

```ts
export async function runAgentLoop(
  userQuery: string,
  maxIterations = 10
): Promise<{ finalMessage: Anthropic.Message; iterations: number }> {
  throw new Error("TODO: implementa runAgentLoop() — lee el ejercicio en es/exercise.md");
}
```

4. Exports `default async function run()` that throws `new Error("TODO: implementa run()")`.

5. Locale-neutral — no Spanish or English prose inline (only in `es/` and `en/` exercise.md).

6. Exercise 03 additionally exports `ConversationState` interface and `startConversation` stub.
   Exercise 02 additionally exports `evaluateStop` stub.

---

## Test structure

### Guard pattern (ALL test files — agents track)

```ts
beforeAll(() => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Integration tests require ANTHROPIC_API_KEY");
  }
});
```

No `VOYAGE_API_KEY` needed — keyword search has zero API cost.

### Test organization per file

```
tests.test.ts
├── describe("unit — evaluateStop", () => { ... })     // exercise 02 only, no API
└── describe("integration — <exercise>", () => {
      beforeAll(() => { /* guard ANTHROPIC_API_KEY */ });
      test("...", async () => { ... });
    })
```

### Assertion patterns

- Range assertions for iteration counts: `>= N && <= 10`. NEVER exact counts.
- Soft semantic checks on text content: regex or substring. NEVER literal LLM output equality.
- Model name: match `/haiku/i` regex, not hardcoded string comparison.
- Tool name assertions: `Array.find(t => t.name === "search_docs")` — never positional index.
- `result.calls` iteration: use `result.calls[result.calls.length - 1]` for last call, or `.find()` for specific conditions.
- Floating point: `toBeCloseTo` where relevant (not needed for agents track).

### Exercise 02 unit test block

```ts
describe("unit — evaluateStop", () => {
  test("end_turn → 'end_turn'", () => { ... });
  test("iteration >= max with tool_use → 'max_iterations'", () => { ... });
  test("goalPredicate true → 'goal_reached'", () => { ... });
  test("tool_use + below max + no goal → 'continue'", () => { ... });
});
```

These tests construct minimal `Anthropic.Message`-shaped objects (no SDK import needed for the mock shape).

---

## Track structure

### Directory layout

```
code/packages/exercises/05-agents/
├── fixtures/
│   └── research-tools.ts
├── 01-agent-loop/
│   ├── es/exercise.md
│   ├── en/exercise.md
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   └── meta.json
├── 02-stop-conditions/
│   └── (same structure)
├── 03-state-management/
│   └── (same structure)
├── 04-multi-step-plan/
│   └── (same structure)
└── 05-self-correction/
    └── (same structure)
```

### `meta.json` fields per exercise

| Field | Value |
|---|---|
| `id` | directory name (e.g. `"01-agent-loop"`) |
| `track` | `"05-agents"` |
| `title` | Human-readable, matches exercise.md H1 |
| `version` | `"1.0.0"` |
| `valid_until` | `"2026-10-15"` |
| `locales` | `["es", "en"]` |
| `concepts` | see table below |
| `estimated_minutes` | see table below |
| `requires` | see chain below |

### `requires` dependency chain

| Exercise | `requires` |
|---|---|
| `01-agent-loop` | `["01-first-call"]` |
| `02-stop-conditions` | `["01-agent-loop"]` |
| `03-state-management` | `["02-stop-conditions"]` |
| `04-multi-step-plan` | `["03-state-management"]` |
| `05-self-correction` | `["04-multi-step-plan"]` |

### `concepts` tags per exercise

| Exercise | `concepts` |
|---|---|
| `01-agent-loop` | `["agent-loop", "tool-use", "stop-reason", "think-act-observe", "diy-loop"]` |
| `02-stop-conditions` | `["stop-conditions", "goal-predicate", "max-iterations", "termination-logic"]` |
| `03-state-management` | `["conversation-state", "message-history", "multi-turn", "stateless-api"]` |
| `04-multi-step-plan` | `["task-decomposition", "planning-prompt", "multi-step", "prompt-engineering"]` |
| `05-self-correction` | `["self-correction", "error-recovery", "tool-errors", "retry-logic"]` |

### `estimated_minutes` per exercise

| Exercise | Minutes |
|---|---|
| `01-agent-loop` | 25 |
| `02-stop-conditions` | 30 |
| `03-state-management` | 30 |
| `04-multi-step-plan` | 35 |
| `05-self-correction` | 35 |

### `model_cost_hint` per exercise

| Exercise | Hint |
|---|---|
| `01-agent-loop` | `"~$0.002 (Haiku 4.5, 1–3 iterations)"` |
| `02-stop-conditions` | `"~$0.005 (Haiku 4.5, multiple stop condition tests)"` |
| `03-state-management` | `"~$0.005 (Haiku 4.5, 2-turn conversation)"` |
| `04-multi-step-plan` | `"~$0.010 (Haiku 4.5, maxIterations:10 cap)"` |
| `05-self-correction` | `"~$0.005 (Haiku 4.5, deliberate error + recovery)"` |

### CLI discovery

No changes to `code/packages/cli/src/exercises.ts` — it already discovers tracks dynamically via directory scan and groups by track slug.

---

## Exercise.md structure

All `exercise.md` files (both `es/` and `en/`) MUST follow the 6-section contract defined in `docs/EXERCISE-CONTRACT.md`:

1. **`# Exercise <NN> — <title>`** — H1 matching `meta.json.title`
2. **`## Concepto`** / **`## Concept`** — What to understand before touching code. 2–4 paragraphs. No code.
3. **`## Docs & referencias`** / **`## Docs & references`** — Official links only, numbered, canonical `docs.claude.com/...` URLs.
4. **`## Tu tarea`** / **`## Your task`** — Step-by-step implementation guide for `starter.ts`.
5. **`## Cómo verificar`** / **`## How to verify`** — `aidev verify <id>` command + bullet list of what tests check.
6. **`## Concepto extra (opcional)`** / **`## Extra concept (optional)`** — Optional deepening.

### Canonical doc URLs for this track

- Tool use overview: `https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview`
- Implement tool use: `https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use`
- Tool runner (beta): `https://docs.claude.com/en/docs/agents-and-tools/tool-use/tool-runner`

### `## Concepto` content requirements per exercise

**`01-agent-loop`**:
- Define what an agent IS: a loop where the model decides what to do, acts via tools, observes results, and iterates until goal reached or limit hit. Draw the think→act→observe cycle in text.
- Explain why DIY loop > SDK Tool Runner for learning: the learner must see each `stop_reason`, each tool dispatch, each `tool_result` message construction — Tool Runner hides all of this.
- Explain `stop_reason: "tool_use"` vs `stop_reason: "end_turn"` — the two branches of every agent loop iteration.

**`02-stop-conditions`**:
- Side-by-side comparison of 3 stop conditions:

  | Condition | When | Use for |
  |---|---|---|
  | `end_turn` | Model decided it's done | Normal completion |
  | `max_iterations` | Hard cap hit | Cost / safety ceiling |
  | `goal_predicate` | Custom logic true | Business rule satisfaction |

- Explain WHY all 3 are needed together: model alone can loop forever; hard cap without goal check wastes tokens; goal check without cap is unsafe.

**`03-state-management`**:
- Explain the fundamental concept: Claude's API is stateless. The model has NO memory between calls — you must send the full `messages[]` array on every request.
- Explain that `ConversationState` is the simplest possible externalization of this state. More advanced systems use SQLite, Redis, or vector stores.
- Explain why turn 2's "And the extended TTL option?" only works with history: without `messages[]`, it's an unresolvable pronoun reference.

**`04-multi-step-plan`**:
- Explain planning prompts: instructing the model to plan before acting changes how it decomposes the problem. Without "plan first", the model may issue one broad search and stop.
- Explain why ≥2 distinct `search_docs` queries are the quality signal: one query for "5-minute TTL" and one for "1-hour TTL" (or similar) demonstrates the model internalized the sub-problems.
- Contrast with naive one-shot retrieval — show the token/quality tradeoff.

**`05-self-correction`**:
- Define error observation: the agent sees `{ error: "..." }` in a `tool_result` block — this is part of the conversation history. The model CAN reason over it if the system prompt instructs recovery.
- Explain the recovery pattern: system prompt = contract. "If tool returns error, try different approach" is a behavioral constraint.
- Explain `retries` counter: counts error-containing tool results, not iterations. A loop with 3 iterations but 1 error has `retries: 1`.

### `## Concepto extra` content per exercise

- **`01-agent-loop`**: Mention `client.beta.messages.toolRunner()` from `@anthropic-ai/sdk` as a production convenience that abstracts the loop. Link: `https://docs.claude.com/en/docs/agents-and-tools/tool-use/tool-runner`. Note: abstracts the pedagogy — learn the loop first, use Tool Runner in production.
- **`02-stop-conditions`**: Mention that goal predicates in production often involve parsing structured JSON from the model response (e.g. `{ "done": true, "answer": "..." }`) rather than text matching.
- **`03-state-management`**: Mention external state stores (SQLite, Redis, vector DBs for long-term memory). Mention context window management (summarization, sliding window) for very long conversations.
- **`04-multi-step-plan`**: Mention Chain-of-Thought prompting ("think step by step") vs explicit planning prompts. Mention that extended thinking mode (`"thinking": { "type": "enabled" }`) internalizes the planning process — Sonnet/Opus only.
- **`05-self-correction`**: Mention `disable_parallel_tool_use: true` in `tool_choice` — forces sequential tool execution, making error propagation predictable and avoiding partial-failure states when one of N parallel tools errors.

---

## Out of scope (delta)

The following are explicitly excluded from this change:

- MCP servers (next track)
- `@anthropic-ai/sdk` Tool Runner as primary implementation path (only Concepto extra in 01)
- Subagents / multi-agent orchestration
- Computer use / web research tools
- Semantic search in agent tools (04-rag covers embeddings; agents track uses keyword search)
- External memory stores (SQLite, Redis, vector DBs) as implementation requirement
- Parallel agents
- Any changes to `code/packages/runner/src/harness.ts`
- Any changes to `code/packages/cli/src/`
- Any changes to `cost.ts`
- New npm dependencies
- Track-level README
- Multi-provider support
- Streaming in any exercise
