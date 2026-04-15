# Exploration: add-rag-track

**Change**: `add-rag-track`
**Phase**: explore
**Date**: 2026-04-14

---

## Summary

Track 04-rag adds 5 exercises teaching RAG using Voyage AI embeddings + in-memory vector store. Anthropic's canonical docs explicitly delegate all embeddings to Voyage AI. An official TypeScript SDK (`voyageai` v0.2.1) exists. The existing harness does NOT intercept Voyage calls — tests must assert on return shapes and similarity scores instead of `result.calls`. Total learner cost is well under $0.01 for the full track.

---

## API Research Findings

### Auth
- Env var: `VOYAGE_API_KEY` — conventional, confirmed in Anthropic + Voyage docs.
- Separate from `ANTHROPIC_API_KEY`. Learners need both for exercises 04 and 05.
- Source: https://platform.claude.com/docs/en/build-with-claude/embeddings

### TypeScript SDK
- **Official SDK exists**: `voyageai` v0.2.1 on npm.
- Repo: https://github.com/voyage-ai/typescript-sdk (built with Fern — auto-generated, maintained by Voyage AI).
- Alternative: raw `fetch` to `https://api.voyageai.com/v1/embeddings` with `Authorization: Bearer $VOYAGE_API_KEY`.
- **Recommendation**: use raw `fetch` with typed interfaces we define ourselves. Reasons:
  1. Keeps the exercise dependency-free (no extra npm install for the learner).
  2. Teaches the HTTP contract directly — learners see `input_type: "query" | "document"` as first-class concepts.
  3. SDK v0.2.1 is pre-1.0; API may drift.
  4. `fetch` is native in Bun — zero overhead.

### Endpoint Shape (confirmed)
```
POST https://api.voyageai.com/v1/embeddings
Authorization: Bearer $VOYAGE_API_KEY
Content-Type: application/json

{
  "input": string | string[],
  "model": string,
  "input_type": "query" | "document" | null   // always specify for RAG
}

Response:
{
  "data": [{ "embedding": number[], "index": number }],
  "model": string,
  "usage": { "total_tokens": number }
}
```
Source: https://docs.voyageai.com/reference/embeddings-api

### Models (relevant to bootcamp)
| Model | Context | Default Dims | Price/1M tokens | Notes |
|---|---|---|---|---|
| `voyage-3.5-lite` | 32k | 1024 | $0.02 | Best cost/latency — **bootcamp default** |
| `voyage-3.5` | 32k | 1024 | $0.06 (implied from voyage-4) | Balanced quality |
| `voyage-3-large` | 32k | 1024 | $0.12 | Best quality, overkill for bootcamp |

**Bootcamp model**: `voyage-3.5-lite` at $0.02/1M tokens.

Note: Anthropic's embeddings page still references `voyage-3-large` and `voyage-3.5` as the recommended general-purpose models (last updated before voyage-4 series). `voyage-3.5-lite` is listed as the cost-optimized option and is appropriate for an educational bootcamp.

### Free Tier
- **200M free tokens/month** for `voyage-3.5-lite` (confirmed on pricing page under "current models" complimentary tier).
- This covers millions of learner runs — no paid tier needed for bootcamp usage.
- Source: https://docs.voyageai.com/docs/pricing

### Anthropic Canonical Endorsement
Confirmed. From https://platform.claude.com/docs/en/build-with-claude/embeddings:
> "Anthropic does not offer its own embedding model. One embeddings provider that has a wide variety of options and capabilities encompassing all of the above considerations is Voyage AI."

The entire embeddings guide is Voyage-first. This is the canonical path.

---

## Harness Gaps + Recommended Pattern

**Confirmed gap**: `harness.ts` monkey-patches only `Anthropic.Messages.prototype.create` and `.stream`. Voyage API calls — whether via `voyageai` SDK or raw `fetch` — are invisible to the harness. `result.calls` will always be empty for exercises 01-03, and will only have Haiku entries for 04-05.

**Three options considered**:

| Option | Description | Verdict |
|---|---|---|
| A | Tests import + call embedding helpers directly for structural assertions | **Recommended** |
| B | Mock the Voyage API in tests with `mock.module` | Over-engineered for education |
| C | Extend harness to intercept `fetch` calls to voyageai.com | Too invasive, breaks abstraction |

**Recommended pattern (Option A)**:
- Each exercise exports named helper functions (e.g., `embed`, `cosineSimilarity`, `search`).
- Tests call these functions directly with known inputs and assert on output *shape and semantics*:
  - `embed("hello")` → returns `number[]` with length 1024
  - `cosineSimilarity([1,0], [1,0])` → `1.0` (pure math, no API needed)
  - `search("caching", corpus, 3)` → top-3 results contain chunks about caching
- For exercises 04-05, `result.calls` from the harness captures the Haiku generation call — structure assertions work normally there.
- This is consistent with how tool-use exercises test tool definitions and schemas without asserting on LLM text.

**No harness extension needed.**

---

## cost.ts Decision

**Current shape**: `ModelFamily` requires both `input` and `output` prices. Voyage embeddings have no output tokens. The `estimateCost` function is Anthropic-model-only and matches by regex against model names like `/haiku/i`.

**Options**:

| Option | Description | Tradeoff |
|---|---|---|
| A | Extend `MODEL_PRICES` with `voyage-*` entries (output: 0) | Requires shape change or `output?: number`; `estimateCost` becomes multi-provider |
| B | Skip CLI cost tracking for Voyage; compute cost inline in each exercise | Zero risk to existing code; simpler |

**Recommendation: Option B (skip in CLI)**. Reasons:
- The existing `estimateCost` function is called by `aidev run` with the `model` string from `result.lastCall` — which is an Anthropic model. Voyage has no `result.calls` entry.
- Extending `ModelFamily` for input-only pricing adds complexity to a module that has clean Anthropic-only semantics today.
- Each exercise can compute and print Voyage cost inline: `(totalTokens / 1_000_000) * 0.02` — learners see the math directly, which is educational.
- Exercises 04-05 cost tracking (Haiku) already works via existing `estimateCost`.

---

## Proposed Exercise List

| # | id | Title | Core Concept | Est. Minutes | Cost Hint |
|---|---|---|---|---|---|
| 01 | `01-embeddings-basics` | Embeddings Basics | Call Voyage API, get a vector, compute cosine similarity | 20 | < $0.001 |
| 02 | `02-vector-search` | Vector Search | Embed a corpus + query, rank by similarity, return top-K | 25 | < $0.001 |
| 03 | `03-chunking-strategies` | Chunking Strategies | Split text into fixed/sentence/paragraph chunks; measure retrieval impact | 30 | < $0.002 |
| 04 | `04-retrieval-pipeline` | Retrieval Pipeline | End-to-end RAG: retrieve chunks + generate answer with Haiku | 35 | < $0.005 |
| 05 | `05-citations-grounding` | Citations & Grounding | Generate answers with source citations; validate grounding | 35 | < $0.005 |

All exercises: bilingual `es` + `en`, `voyage-3.5-lite` for embeddings, `claude-haiku-4-5` for generation (04-05).

---

## Total Cost Estimate

**Voyage (embeddings)**:
- Fixture corpus: 15 chunks × ~200 tokens = 3,000 tokens
- Per exercise run (embed corpus + 2-3 queries × ~50 tokens): ~3,150 tokens
- 5 exercises × 3,150 tokens = ~15,750 tokens
- At $0.02/1M tokens = **$0.000315 per full track run**

**Anthropic/Haiku (generation)**:
- Exercises 04-05: ~4,000 input + ~300 output per call × 2 exercises
- Input: 8,000 × $1.00/1M = $0.008; Output: 600 × $5.00/1M = $0.003
- **~$0.011 for both generation exercises**

**Total per learner run**: ~$0.012 — well within the $0.05 target.

**Free tier coverage**: Voyage's 200M free tokens/month means Voyage costs are $0.00 in practice for bootcamp learners.

---

## Fixture Design

Path: `code/packages/exercises/04-rag/fixtures/docs-chunks.ts`

Export: `CHUNKS: { id: string, content: string, metadata: { source: string, topic: string } }[]`

Proposed chunk topics (~15 total):
1. `cache_control` — what it is, where to place it
2. `cache_ttl_5min` — 5-minute ephemeral TTL
3. `cache_ttl_1h` — 1-hour ephemeral TTL (if available)
4. `cache_breakpoints` — up to 4 cache breakpoints
5. `cache_cost` — read at 0.1×, write at 1.25×
6. `cache_use_cases` — when to use prompt caching
7. `tool_definition` — name, description, input_schema shape
8. `tool_choice` — auto / any / tool modes
9. `tool_result` — returning results back in the next turn
10. `tool_loop` — agentic loop pattern
11. `parallel_tools` — multiple tool_use blocks in one response
12. `streaming_basics` — what streaming is, MessageStreamEvent
13. `token_counting` — input/output/cache token fields in Usage
14. `haiku_use_cases` — when to use Haiku vs Sonnet vs Opus
15. `rag_overview` — what RAG is (meta-chunk for the track itself)

Each chunk: 150-300 tokens. Text excerpted/paraphrased from Anthropic docs (not verbatim copy). No pre-computed embeddings — exercises compute them.

---

## Helper Contract Sketch

```typescript
// 01-embeddings-basics
export async function embed(text: string): Promise<number[]>
export function cosineSimilarity(a: number[], b: number[]): number

// 02-vector-search
export interface Chunk { id: string; content: string; metadata: Record<string, string> }
export interface RankedChunk extends Chunk { score: number }
export async function search(query: string, corpus: Chunk[], topK: number): Promise<RankedChunk[]>

// 03-chunking-strategies
export type ChunkStrategy = "fixed" | "sentence" | "paragraph"
export function chunk(text: string, strategy: ChunkStrategy, options?: { size?: number }): string[]

// 04-retrieval-pipeline
export async function retrieveAndGenerate(
  query: string,
  corpus: Chunk[]
): Promise<{ answer: string; chunks: RankedChunk[] }>

// 05-citations-grounding
export interface Citation { chunkId: string; quote: string }
export async function generateWithCitations(
  query: string,
  chunks: RankedChunk[]
): Promise<{ answer: string; citations: Citation[] }>
```

---

## Open Questions / Risks

1. **Free tier confirmed** — 200M tokens/month. Learners do NOT need a paid Voyage account. Just sign up and get `VOYAGE_API_KEY`. Low friction. ✅

2. **Fair use / excerpting** — Chunks will be paraphrased from Anthropic public docs, not verbatim copy. Consistent with what the existing exercise content already does. Low risk. ✅

3. **SDK vs fetch** — Recommendation is raw `fetch`. If the SDK approach is preferred, `voyageai` v0.2.1 is available. Decision is reversible at apply time; the helper contract is the same either way. 🔶 (No user decision needed — default to `fetch`.)

4. **`voyage-3.5-lite` vs `voyage-3.5`** — `3.5-lite` recommended for cost discipline. Quality difference is minor for a 15-chunk corpus. If the user prefers `3.5` for better retrieval quality, cost is still ~$0.0001 per run — acceptable. 🔶

5. **`beforeAll` guard in tests** — Tests must guard BOTH `ANTHROPIC_API_KEY` (exercises 04-05) AND `VOYAGE_API_KEY` (all exercises). A missing Voyage key on CI would cause all 5 exercises to fail without a clear error. Recommend a shared `fixtures/test-setup.ts` that checks both keys and skips with a descriptive message.

6. **Rate limits** — Voyage rate limit specifics not found in public docs. Free tier accounts typically have lower limits (e.g., 100 RPM). The bootcamp's sequential exercise model (one learner, one query at a time) will never hit these limits.

---

## skill_resolution: injected
