# Exploration: add-agents-track

**Date**: 2026-04-14  
**Status**: complete  
**Change**: add-agents-track

---

## Summary

Track 05-agents is fully ready to build. No harness changes needed. The SDK's beta Tool Runner is a real but pedagogically wrong choice — DIY loop confirmed. Shared fixtures follow established track conventions and cross-reference 04-rag chunks directly.

---

## API Research Findings

### Agent SDK — Does it exist?

**`@anthropic-ai/agent-sdk` does NOT exist on npm.** Confirmed: npm returns "NOT FOUND". There is no separate agent SDK package.

**What does exist**: `@anthropic-ai/sdk@0.89.0` (latest) ships a **beta Tool Runner** (`client.beta.messages.toolRunner()`), documented at:  
`https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/tool-runner`

The Tool Runner (`betaZodTool`, `betaTool`) abstracts:
- The agentic loop (`for await (const message of runner)`)
- Tool dispatch (auto-calls registered `run()` functions)
- Message history management (auto-appends tool results)
- Error wrapping (`is_error: true` forwarded to Claude automatically)
- Optional streaming support

**Decision: DIY loop (confirmed)**  
Anthropic's own docs say: *"Use the manual loop only when you need human-in-the-loop approval, custom logging, or conditional execution."* The bootcamp needs exactly this — learners must SEE the think→act→observe cycle. The Tool Runner hides all the pedagogy.

The Tool Runner should be mentioned in `05-self-correction`'s "Concepto extra" as a production convenience, linking to:  
`https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/tool-runner`

**Canonical agent loop docs**:
- `https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/implement-tool-use` (define tools + agentic loop)
- `https://platform.claude.com/docs/en/docs/agents-and-tools/tool-use/tool-runner` (Tool Runner beta)

---

## Harness Compatibility

**No harness changes needed. Zero gaps.**

Verified via `code/packages/runner/src/harness.ts`:

- `patchedCreate` captures each `messages.create` call into `calls: CapturedCall[]`.
- A 5-iteration agent loop produces exactly 5 entries in `result.calls[]`.
- `result.calls.length` can be asserted directly in tests to verify iteration count.
- `result.calls[i].request.messages` carries the full conversation at each turn — tests can inspect which tools were called and with what inputs.
- Streaming path (`patchedStream`) is independent — no interference.
- `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET` pattern works unchanged.

One note: tests must use **range assertions** (`1 <= iterations && iterations <= 10`), not exact counts. Haiku can decide to search more or fewer times. This is documented in the risks below.

---

## Proposed 5 Exercises

| # | id | title | single concept | est. minutes | cost hint |
|---|---|---|---|---|---|
| 1 | `01-agent-loop` | The Agent Loop | Implement think→act→observe cycle until `end_turn` or `maxIterations` | 25 min | ~$0.002 |
| 2 | `02-stop-conditions` | Stop Conditions | Layered termination: natural stop + hard cap + goal predicate | 30 min | ~$0.005 |
| 3 | `03-state-management` | State Management | Persist `ConversationState` across calls; multi-turn continuity | 30 min | ~$0.005 |
| 4 | `04-multi-step-plan` | Multi-Step Planning | Task decomposition; assert ≥2 distinct `search_docs` queries | 35 min | ~$0.010 |
| 5 | `05-self-correction` | Self-Correction | Inject failing `read_chunk` → agent observes error, retries with valid id | 35 min | ~$0.005 |

All exercises: bilingual `es`+`en`, Haiku 4.5 (`claude-haiku-4-5-20251001`), shared fixture.

---

## Shared Fixture Design

### Location
`code/packages/exercises/05-agents/fixtures/research-tools.ts`

### Rationale
- Follows track-level convention: `02-caching/fixtures/long-system-prompt.ts`, `04-rag/fixtures/docs-chunks.ts`.
- Every exercise uses the same 2 tools; inlining would duplicate ~50 lines × 5 exercises = ~250 lines.
- Fixture imports `DOCS_CHUNKS` directly from `04-rag/fixtures/docs-chunks.ts` — no data duplication.

### Fixture shape (designed, not created)

```ts
// code/packages/exercises/05-agents/fixtures/research-tools.ts
import { DOCS_CHUNKS } from "../../04-rag/fixtures/docs-chunks.ts";

export const SEARCH_DOCS_TOOL = { /* ... */ };
export const READ_CHUNK_TOOL = { /* ... */ };

export function executeSearchDocs(input: { query: string; top_k?: number }): string
export function executeReadChunk(input: { id: string }): string
export function executeTool(name: string, input: unknown): string
```

Search strategy: **keyword substring match** on `chunk.text` + `chunk.metadata.topic`. Zero API cost, zero Voyage dependency, focused on loop mechanics. Production note mentioning semantic search goes in `es/exercise.md` + `en/exercise.md` of `01-agent-loop`.

### DOCS_CHUNKS field name
`docs-chunks.ts` uses `chunk.text` (not `chunk.content`) — confirmed from reading the fixture. The `executeSearchDocs` and `executeReadChunk` implementations must reference `.text`, not `.content`.

---

## Cost Estimate

| Exercise | Iterations | Input tokens/iter | Cost est. |
|---|---|---|---|
| 01-agent-loop | 2-3 | ~800 | $0.002 |
| 02-stop-conditions | 4-5 | ~900 | $0.005 |
| 03-state-management | 3-4 | ~1000 | $0.005 |
| 04-multi-step-plan | 5-8 | ~1200 | $0.010 |
| 05-self-correction | 3-5 | ~900 | $0.005 |

**Total track: ~$0.027** — well under $0.05 target.  
Note: `maxIterations: 10` cap on exercise 04 prevents runaway cost.

Haiku 4.5 pricing: input $0.80/MTok, output $4.00/MTok (as of 2026-04-14).

---

## Open Questions / Risks

1. **Loop-termination flake** (MEDIUM risk): Haiku decides independently how many tool calls to make. Tests that assert `iterations === 3` will flake. Mitigation: assert ranges — e.g., `expect(result.calls.length).toBeGreaterThanOrEqual(2)`. This is a test-design decision, not a harness limitation.

2. **`chunk.text` vs `chunk.content`** (LOW risk, now resolved): `docs-chunks.ts` uses `.text`. Fixture and tests must use `.text`. Noted above.

3. **Self-correction reliability** (MEDIUM risk): Exercise 05 relies on Haiku recognizing an error JSON in a tool result and retrying. System prompt must clearly instruct: "If a tool returns `{ error }`, try a different approach." Without this, Haiku may give up. Solution: explicit system prompt instruction in both `starter.ts` comments and `solution.ts`.

4. **System prompt strategy** (design decision): All exercises should include a system prompt that says: "You have access to search_docs and read_chunk tools. Use them to research the answer. When you have sufficient information, respond directly." This reduces hallucination and shortens loops. Validated by Anthropic's own tool use best practices doc.

5. **No Anthropic-official ReAct/reflexion guidance found**: The agents-overview page returned 404. The tool-use docs focus on the DIY loop pattern without naming ReAct/reflexion explicitly. This is fine — the bootcamp teaches the loop pattern by doing, not by naming patterns academically.

---

## skill_resolution

`injected`
