# Design — add-agents-track

## Architecture overview

No new runtime modules. Track is content-only under `code/packages/exercises/05-agents/`. Two mechanics are taught:

### Agent loop (exercise 01)
```
user query → system prompt + tools → Anthropic.messages.create
                                              ↓
                         ┌── response.stop_reason === "end_turn" ──→ RETURN final message
                         │
                         └── tool_use blocks ──→ executeTool(name, input)
                                                         ↓
                                                  push tool_result to messages
                                                         ↓
                                                  iterate (bounded by maxIterations)
```

### Layered stop conditions (exercise 02)
```
iteration n:
    messages.create → response
         ↓
    goalPredicate(response)? → stoppedReason = "goal_reached", RETURN
         ↓
    stop_reason === "end_turn"? → stoppedReason = "end_turn", RETURN
         ↓
    n >= maxIterations? → stoppedReason = "max_iterations", RETURN
         ↓
    execute tool(s) + iterate
```

Tests are driven by the existing runner harness (`@aidev/runner`), which monkey-patches `Messages.prototype.create` and captures every call. No harness changes needed — multi-call capture already works (see `03-tool-use/02-tool-loop` which captures 2 calls; agents exercises capture 1-10).

## ADRs

### ADR-1: DIY loop, not Agent SDK `beta.messages.toolRunner()`
- **Status**: Accepted
- **Context**: `@anthropic-ai/sdk@0.89.0` ships `beta.messages.toolRunner()` that abstracts the while-loop. Anthropic's own docs recommend a manual loop when custom logic is needed.
- **Decision**: Every exercise uses a manual `while (iteration < maxIterations)` loop.
- **Consequences**: Learners see every byte — tool dispatch, message accumulation, stop-reason branching. The SDK's Tool Runner earns a 1-paragraph "Concepto extra" mention in exercise 05 as a "now that you know what it abstracts, here's the helper" pointer.

### ADR-2: Keyword substring search, not semantic
- **Status**: Accepted
- **Context**: The agents track focuses on loop mechanics, state, and termination. Semantic search is track 04's concern and requires Voyage embeddings with rate-limit handling.
- **Decision**: `executeSearchDocs` performs `toLowerCase()` substring match against `chunk.text` and `chunk.metadata.topic`, returns top-K ids.
- **Consequences**: Zero Voyage dependency in this track, zero new rate-limit concerns. Pedagogy stays on loops, not retrieval quality.

### ADR-3: Cross-track fixture reuse
- **Status**: Accepted
- **Context**: `DOCS_CHUNKS` from `04-rag/fixtures/docs-chunks.ts` is already a curated 15-chunk corpus with stable ids, topics, and urls.
- **Decision**: `05-agents/fixtures/research-tools.ts` imports `DOCS_CHUNKS` and `Chunk` directly from `../../04-rag/fixtures/docs-chunks.ts`.
- **Consequences**: New architectural convention — tracks can depend on earlier tracks' fixtures. Coupling is explicit: this track depends on fields `id`, `text`, `metadata.source`, `metadata.topic`, `metadata.url`. Documented in the spec so any reshape of 04-rag fixtures breaks loudly (typecheck).

### ADR-4: Layered stop conditions over single mechanism
- **Status**: Accepted
- **Context**: Production agents need multiple termination signals (natural end_turn, safety hard-cap, task-specific goal).
- **Decision**: Exercise 02 teaches all three layered (goal → end_turn → max_iterations, in that priority).
- **Consequences**: More complex exercise than a single-stop variant, but matches production practice and gives learners a concrete mental model of priority.

### ADR-5: Range assertions, never exact iteration counts
- **Status**: Accepted
- **Context**: Haiku 4.5 is non-deterministic about how many turns it takes to converge on an answer. Exact counts flake.
- **Decision**: Every iteration-count assertion uses `>= min && <= max` (typically `>= 1 && <= 10`).
- **Consequences**: Tests are robust on successful runs. Assertions on the existence of at least one `tool_use` block plus a final `end_turn` ensure the loop is actually exercised.

### ADR-6: Per-exercise system prompt, no shared template
- **Status**: Accepted
- **Context**: Each exercise teaches a different prompt-engineering pattern (plain agent, goal-directed, state-aware, multi-step planner, self-correcting).
- **Decision**: Each `solution.ts` owns its own system prompt string. No lifted abstraction in the fixture.
- **Consequences**: Some duplication across exercises, but the prompt differences ARE the pedagogy — hiding them would defeat the lesson.

### ADR-7: `maxIterations: 10` as the universal hard cap
- **Status**: Accepted
- **Context**: Even infinite-loop agents must be bounded. Cost needs to be predictable.
- **Decision**: Every exercise's solution and every test call passes `maxIterations: 10`.
- **Consequences**: Worst-case cost per test run is `~10 × Haiku call ≈ ~$0.01`. Five exercises × ~2 tests each = bounded at roughly $0.10 per full track verify.

### ADR-8: `ConversationState` type local to exercise 03
- **Status**: Accepted
- **Context**: State-management is a pedagogical topic of exercise 03, not a cross-exercise concern.
- **Decision**: Define `ConversationState` inline in `03-state-management/solution.ts`. Do not lift to the shared fixture.
- **Consequences**: Fixture stays minimal (tools only). Each exercise's novel type lives with its exercise.

## Module API contracts

### Fixture: `code/packages/exercises/05-agents/fixtures/research-tools.ts`

```ts
import type Anthropic from "@anthropic-ai/sdk";
import { DOCS_CHUNKS, type Chunk } from "../../04-rag/fixtures/docs-chunks.ts";

type ToolDefinition = Anthropic.Tool;

export const SEARCH_DOCS_TOOL: ToolDefinition = {
  name: "search_docs",
  description:
    "Search the Anthropic docs corpus for chunks matching a keyword query. Returns top-K chunk ids + topic metadata (NOT full content).",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Keyword or phrase to search for." },
      top_k: { type: "number", description: "Max chunks to return (default 3)." },
    },
    required: ["query"],
  },
};

export const READ_CHUNK_TOOL: ToolDefinition = {
  name: "read_chunk",
  description:
    "Read the full content of a specific docs chunk by id. Use this after search_docs finds a relevant id.",
  input_schema: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
};

export const AGENT_TOOLS = [SEARCH_DOCS_TOOL, READ_CHUNK_TOOL] as const;

export function executeSearchDocs(input: { query: string; top_k?: number }): string {
  const topK = input.top_k ?? 3;
  const q = input.query.toLowerCase();
  const matches = DOCS_CHUNKS
    .filter(
      (c) =>
        c.text.toLowerCase().includes(q) ||
        c.metadata.topic.toLowerCase().includes(q),
    )
    .slice(0, topK)
    .map((c) => ({ id: c.id, topic: c.metadata.topic, source: c.metadata.source }));
  return JSON.stringify(matches);
}

export function executeReadChunk(input: { id: string }): string {
  const chunk = DOCS_CHUNKS.find((c) => c.id === input.id);
  if (!chunk) return JSON.stringify({ error: `Chunk not found: ${input.id}` });
  return JSON.stringify({ id: chunk.id, content: chunk.text, metadata: chunk.metadata });
}

export function executeTool(name: string, input: unknown): string {
  if (name === "search_docs")
    return executeSearchDocs(input as { query: string; top_k?: number });
  if (name === "read_chunk") return executeReadChunk(input as { id: string });
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}
```

**Field-name confirmation**: `chunk.text` is the correct field (verified by reading `code/packages/exercises/04-rag/fixtures/docs-chunks.ts` — interface `Chunk` declares `text: string`). NOT `.content`.

### Exercise entry signatures

Every exercise exports `default async function run()` returning the last `Message` (so the harness captures all calls and tests assert on `result.calls`).

Per-exercise contract sketches:

- **01-agent-loop**: `run()` runs one query through a bounded loop. Asserts `calls.length >= 2 && <= 10`, at least one `tool_use` block in non-final calls, final `stop_reason === "end_turn"`.
- **02-stop-conditions**: `run()` exposes `runAgent(opts)` where `opts.goalPredicate?: (msg: Message) => boolean`. Tests exercise three scenarios: goal-hit, natural end_turn, max_iterations-hit. Uses `stoppedReason` discriminator in the returned state.
- **03-state-management**: `run()` builds a `ConversationState { messages, iteration, toolCallLog }`. Test asserts `toolCallLog.length === calls[*].content.filter(b=>b.type==='tool_use').length`.
- **04-multi-step-plan**: `run()` poses a multi-part question. Test asserts at least 2 distinct tool invocations with different `query` inputs.
- **05-self-correction**: `run()` simulates an initial dead-end via a narrow first query. Test asserts the agent retries `search_docs` with a distinct `query` string after a low-signal first result.

## File layout

```
code/packages/exercises/05-agents/
├── fixtures/
│   └── research-tools.ts
├── 01-agent-loop/
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   ├── meta.json
│   ├── es/exercise.md
│   └── en/exercise.md
├── 02-stop-conditions/   (same 6-file shape)
├── 03-state-management/
├── 04-multi-step-plan/
└── 05-self-correction/
```

## Testing strategy

- **Pure unit**: optional for a small `evaluateStop()` helper in exercise 02 if the learner extracts it. Harness not required.
- **Integration**: all 5 exercises against real Haiku 4.5. Guard `ANTHROPIC_API_KEY` in `beforeAll` (skip if missing).
- **Range assertions**: `calls.length` and `iteration` counts use `>=min && <=max`.
- **Semantic checks**: soft regex / substring on the final assistant text when content is asserted at all.
- **Universal hard cap**: `maxIterations: 10` in every test.
- **Timeouts**: tests may need `--timeout 30000` (agent loops of 5-10 Haiku calls take 15-25s).
- **Parallelism**: no Voyage rate limit → default Bun test concurrency is fine.

## Risk register

1. **Haiku non-determinism** — mitigated by range assertions and structure-only checks.
2. **Self-correction flake (ex 05)** — strong system prompt ("if first search returns no useful matches, retry with a broader query"). Test asserts distinct `query` strings across the first two `search_docs` tool_use blocks, not specific content.
3. **Cross-track fixture coupling** — relies on `Chunk` fields (`id`, `text`, `metadata.source`, `metadata.topic`, `metadata.url`). If 04-rag reshapes, TypeScript breaks loudly. Documented in spec.
4. **Token growth in ex 04** — multi-step plans accumulate 10+ turns of tool_result blocks; Haiku's 200K context is ample. No truncation logic needed in track.
5. **Tool Runner SDK evolution** — 1-paragraph mention only, no API binding.

## Implementation order (strict TDD)

- **Batch 0 (prerequisite)**: write `fixtures/research-tools.ts`. All 5 exercises depend on it. No tests for the fixture itself — it's consumed by every exercise's `solution.ts` whose tests exercise it transitively.
- **Batches 1-5**: one exercise per batch, strictly in order 01 → 05. Per exercise:
  1. Write `tests.test.ts` first.
  2. Write `starter.ts` that throws `TODO` — confirm tests FAIL.
  3. Write `solution.ts` — confirm tests PASS with `AIDEV_TARGET=solution`.
  4. Write `es/exercise.md` + `en/exercise.md`.
  5. Write `meta.json` (declare `"locales": ["es", "en"]`).
  6. Run `aidev list` to confirm discovery.
  7. Commit (conventional, no AI attribution).

## Open questions for implementation

- Confirm timeout flag: tests likely need `--timeout 30000`. Apply phase to verify empirically with exercise 01.
- Bun default concurrency is fine (no external rate limits). No `--concurrency=1` needed.
