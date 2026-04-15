# Design — add-rag-track

## Architecture overview

No new runtime modules. Track `04-rag` is **content only** — 5 exercises + one shared fixture under `code/packages/exercises/04-rag/`. The existing harness, CLI, and exercise contract already cover everything the track needs:

- `runUserCode()` captures every `Anthropic.Messages.prototype.create/.stream` call. Voyage calls are plain `fetch` — they cross the wire transparently, invisible to the harness by design (ADR-7).
- `listExercises()` groups by `trackSlug`; `04-rag` auto-appears once files land.
- `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET` keeps the starter/solution swap free.
- `cost.ts` / `estimateCost()` stay Anthropic-only (ADR-8); Voyage pricing is exposed inline per exercise.

### Embedding flow (exercises 01, 02)

```
text → fetch(voyageai) → number[1024] → cosineSimilarity → rankedChunks
```

### RAG pipeline (exercises 04, 05)

```
query → embed(query, "query") → search(index) → topK chunks
                                                   ↓
                                build system prompt with chunks
                                                   ↓
                             Anthropic.messages.create (Haiku 4.5)
                                                   ↓
                            harness captures {request, response}
                                                   ↓
                  (05 only) parse JSON citations from response.content[0].text
```

## ADRs

### ADR-1: Voyage API via raw `fetch`, no SDK

**Status**: Accepted.
**Context**: Voyage AI publishes a Python SDK and a small JS wrapper, but our curriculum goal is to demystify the *HTTP contract* of an embedding provider — exactly the same skill that generalizes to Cohere, OpenAI embeddings, local models via text-embeddings-inference, etc.
**Decision**: Call `https://api.voyageai.com/v1/embeddings` via Bun's native `fetch`. No SDK dependency.
**Consequences**: Learner manually types request/response shapes; they see `Authorization: Bearer`, `input_type`, `model` as first-class parameters. Zero dep bloat. Works natively under Bun. Cost: no auto-retries — we teach that as a separate concept, and at ~15 chunks per corpus it's a non-issue.

### ADR-2: In-memory JSON vector store

**Status**: Accepted.
**Context**: Production RAG uses pgvector / Pinecone / Qdrant. Introducing any of those would derail the lesson into infra setup.
**Decision**: Store embeddings as `{ id, embedding: number[], metadata }[]` in memory. Search is O(n) linear scan.
**Consequences**: Perfect for a 15-chunk corpus (~15 dot products per query, sub-millisecond). Exercise 04's `exercise.md` explicitly flags this as a pedagogical simplification with a "Production considerations" section pointing to pgvector and managed vector DBs.

### ADR-3: Shared corpus fixture at track level

**Status**: Accepted.
**Context**: Five exercises need the same chunked corpus. Inlining it per exercise duplicates ~5 KB of prose five times and hides the fact that chunking is a one-time step.
**Decision**: `04-rag/fixtures/docs-chunks.ts` exports `DOCS_CHUNKS: Chunk[]`. Same pattern as `02-caching/fixtures/long-system-prompt.ts`.
**Consequences**: DRY. Learners read the corpus *once*. The `03-chunking-strategies` exercise teaches chunking mechanics on raw text separately, so the shared fixture does not pre-empt that lesson.

### ADR-4: Anthropic docs as corpus content

**Status**: Accepted.
**Context**: Candidate corpora: Wikipedia snippets, a fake product manual, Anthropic's own docs.
**Decision**: Use paraphrased excerpts from `docs.claude.com` prompt caching + tool use pages.
**Consequences**: Dual pedagogy — learner reinforces concepts from tracks 02 and 03 while learning RAG. Citation answers become self-validating ("does the cited chunk actually say that?"). Drawback: our paraphrases drift as Anthropic rewrites docs; mitigated by `valid_until: 2026-10-15` and a quarterly content review (follow-up issue).

### ADR-5: Voyage embeddings are L2-normalized → dot product = cosine similarity

**Status**: Accepted.
**Context**: Voyage (like OpenAI and Cohere) returns L2-normalized vectors. Full cosine similarity formula (`dot / (|a|·|b|)`) is equivalent to `dot` when `|a| = |b| = 1`.
**Decision**: Teach both in exercise 01 — learner implements full cosine first (understands the math), then we note that for normalized embeddings `dot` suffices. All subsequent exercises use one `cosineSimilarity(a, b)` helper that does the dot product.
**Consequences**: One implementation, correct reasoning. Learners understand *why* the shortcut works, not just that it does.

### ADR-6: `input_type` is a first-class parameter of `embed()`

**Status**: Accepted.
**Context**: Voyage's asymmetric embeddings require different `input_type` for indexing (`"document"`) vs querying (`"query"`). Hiding this behind a default would save ~3 lines per exercise but strip a core concept.
**Decision**: The `embed()` / `voyageEmbed()` signature requires `inputType` as an explicit argument. Starter docstrings call out the asymmetry.
**Consequences**: Learners see directly that retrieval quality depends on correctly labeling document vs query embeddings. This concept transfers to any asymmetric embedding model (Cohere embed-v3, OpenAI text-embedding-3 with query prefixes, BGE-M3).

### ADR-7: No harness extension

**Status**: Accepted.
**Context**: Voyage calls are `fetch`-based. The harness monkey-patches `Anthropic.Messages.prototype.create/.stream` exclusively.
**Decision**: Ship content only. Tests for 01–03 assert on exported helper shapes/semantics without `runUserCode()` (pure unit tests). Tests for 04–05 use `runUserCode()` to capture the Haiku call, then assert on `calls[0]` + on the helper-level return values from the exercise's default export.
**Consequences**: Zero runtime risk. The track is self-contained. If we later want to intercept Voyage for cost telemetry, we can add a `fetch` proxy in the harness — out of scope for this change.

### ADR-8: No `cost.ts` extension

**Status**: Accepted.
**Context**: `estimateCost()` prices Anthropic models. Extending it to Voyage means either a second function or a provider-tagged registry.
**Decision**: Leave `estimateCost()` untouched. Voyage pricing (`voyage-3.5-lite`: $0.02 / 1M tokens) lives inline in each exercise's `exercise.md` "Coste" section and in test-time log output.
**Consequences**: `aidev run` cost summaries remain accurate for Anthropic spend (the expensive side). Voyage at $0.02/1M is effectively free at our token volumes — omitting it from auto-accounting is honest. If multi-provider cost becomes a recurring need, a separate `embedding-cost.ts` change can be proposed later.

### ADR-9: JSON citations via prompt engineering in exercise 05

**Status**: Accepted.
**Context**: Options for structured citations: (a) native tool use with a `cite` tool, (b) prompt engineering with "respond in JSON `{answer, citations: [chunk_id…]}`", (c) not implemented.
**Decision**: Option (b). The system prompt instructs Haiku to reply with a JSON envelope. A small tolerant parser strips optional markdown fences (```json ... ```) before `JSON.parse`.
**Consequences**: Exercise stays within the RAG mental model (no tool-loop distraction). Haiku reliably returns parseable JSON. Risk: occasional format drift — mitigated by the tolerant parser + a test that retries the raw LLM output in the error message for debugging.

## Module API contracts

All helpers are exercise-level exports — no shared helpers module. Spec sketches copied verbatim for the apply phase:

```ts
// Shared across exercises
export interface Chunk {
  id: string;                       // e.g. "caching-03"
  text: string;
  metadata: {
    source: "prompt-caching-docs" | "tool-use-docs";
    topic: string;                  // e.g. "cache-control", "tool-result"
    url: string;                    // canonical docs.claude.com URL
  };
}

// 01-embeddings-basics
export async function embed(
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][]>;
export function cosineSimilarity(a: number[], b: number[]): number;

// 02-vector-search
export interface IndexedChunk extends Chunk { embedding: number[] }
export async function buildIndex(chunks: Chunk[]): Promise<IndexedChunk[]>;
export async function search(
  index: IndexedChunk[],
  query: string,
  topK: number,
): Promise<{ chunk: IndexedChunk; score: number }[]>;

// 03-chunking-strategies
export function chunk(
  text: string,
  options: { size: number; overlap: number },
): string[];

// 04-retrieval-pipeline
export async function rag(query: string): Promise<{
  answer: string;
  retrieved: IndexedChunk[];
}>;

// 05-citations-grounding
export async function ragWithCitations(query: string): Promise<{
  answer: string;
  citations: string[];               // chunk ids
  retrieved: IndexedChunk[];
}>;
```

### Voyage HTTP client (inlined per solution.ts)

NOT a shared helper — the point of ADR-1 is that each exercise's `solution.ts` shows the HTTP contract in full.

```ts
async function voyageEmbed(
  inputs: string[],
  inputType: "document" | "query",
): Promise<{ embeddings: number[][]; totalTokens: number }> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: inputs,
      model: "voyage-3.5-lite",
      input_type: inputType,
    }),
  });
  if (!res.ok) {
    throw new Error(`Voyage API error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
    usage: { total_tokens: number };
  };
  return {
    embeddings: data.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding),
    totalTokens: data.usage.total_tokens,
  };
}
```

## Fixture design

`code/packages/exercises/04-rag/fixtures/docs-chunks.ts`:

- **Shape**: `export const DOCS_CHUNKS: Chunk[]`.
- **Size**: ~15 chunks, each 150–300 tokens (deliberately under the Haiku context cost threshold so learners can stuff top-5 comfortably).
- **Split**: ~7 chunks from prompt caching docs, ~8 from tool use docs.
- **IDs**: source-prefixed — `caching-01` … `caching-07`, `tooluse-01` … `tooluse-08`.
- **Metadata**: every chunk has `source`, `topic` (normalized slug like `cache-control`, `tool-result`, `parallel-tools`), and canonical `url` pointing to `docs.claude.com`.
- **Content**: paraphrased excerpts — technically accurate, no marketing prose, no incorrect claims. Concatenation pattern (`_p1 + _p2 + ...`) is NOT needed here because each chunk is a short independent string literal.
- **Total file size**: ~5–7 KB.

## File layout

```
code/packages/exercises/04-rag/
├── fixtures/
│   └── docs-chunks.ts
├── 01-embeddings-basics/
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   ├── meta.json
│   ├── es/exercise.md
│   └── en/exercise.md
├── 02-vector-search/
│   └── (same 6-file layout)
├── 03-chunking-strategies/
├── 04-retrieval-pipeline/
└── 05-citations-grounding/
```

No edits to `code/packages/cli/` or `code/packages/runner/`.

## Testing strategy

### Pure unit tests (no API)

- `cosineSimilarity`: known vector pairs → known scalar results; orthogonal → 0; identical → 1.
- `chunk(text, {size, overlap})`: empty text → `[]`; single short chunk; proper overlap at boundaries; size > text length fallback.
- Shape checks on empty-input paths (e.g. `search(index, "", 5)` behavior).

### Integration tests (real APIs)

- `beforeAll` guards BOTH `ANTHROPIC_API_KEY` AND `VOYAGE_API_KEY`. Throw a descriptive error listing which is missing.
- **01**: `embed(["hello"], "document")` returns `number[1024]`; two embeddings of similar texts have cosine > 0.5; opposite topics < 0.5.
- **02**: `buildIndex(DOCS_CHUNKS)` returns 15 entries with 1024-dim embeddings; `search(index, "how does prompt caching work?", 3)` → top-3 results where at least 2 have `metadata.topic` matching `/cache|cache-control|ttl/i` (soft semantic).
- **03**: chunking unit tests as above; optional integration run with the real docs paragraph.
- **04**: `runUserCode()` → `calls.length === 1`; `calls[0].request.model` is a Haiku; `calls[0].request.system` contains at least one retrieved chunk's text verbatim; `userReturn.answer` is a non-empty string; `userReturn.retrieved.length === topK`.
- **05**: as 04, plus `userReturn.citations` is a non-empty `string[]`; every citation appears as an id in `userReturn.retrieved`; parser tolerates both raw JSON and markdown-fenced JSON (unit-tested separately with fixture strings).

### Soft-semantic pattern

To avoid pinning brittle chunk ids, retrieval-quality assertions use regex over `metadata.topic` across the top-K results. Example:

```ts
const topTopics = results.map(r => r.chunk.metadata.topic).join("|");
expect(topTopics).toMatch(/cache|cache-control|ttl/i);
```

## Risk register

1. **Voyage rate limits under parallel test execution**. Free tier is 3 RPM for the non-paid tier but paid (which we use) is much higher; nevertheless Bun runs tests in parallel. Mitigation: if integration tests flake, wrap each file's integration block in `describe.serial` or add a 250ms throttle between `embed()` calls in solutions. Flag as open question.
2. **Voyage model deprecation** (`voyage-3.5-lite`). Mitigation: `valid_until: 2026-10-15` in every `meta.json` triggers `[stale]` badge in `aidev list`; weekly health-check surfaces early.
3. **Retrieval-quality flake**. Embedding models occasionally rank adjacent-topic chunks higher than exact-match chunks. Mitigation: soft-semantic regex assertions (ADR topic-match pattern above), not exact chunk-id pins.
4. **Haiku JSON parsing in 05**. Mitigation: tolerant parser handles `` ```json `` fences and raw JSON. On parse failure, the error message includes the raw LLM output for debugging. If flaky in practice, relax to a regex-extracted citation array.
5. **Anthropic docs content drift**. Our paraphrased chunks become inaccurate as upstream docs evolve. Mitigation: `valid_until` date + scheduled quarterly review issue.
6. **Voyage quota exhaustion**. Voyage paid tier has generous quotas; corpus indexing is 15 chunks (~3K tokens). Running the full track end-to-end consumes well under $0.01. Non-risk at practical volumes.

## Implementation order (strict TDD)

**Batch 0 — Prerequisite**: write `fixtures/docs-chunks.ts` FIRST. Exercises 02, 04, 05 depend on it. Typecheck + a trivial import test to confirm the export.

**Batches 1–5 — one exercise at a time**. For each N ∈ {01, 02, 03, 04, 05}:

1. Create `04-rag/0N-<slug>/` with `es/` and `en/` subdirs.
2. Write `tests.test.ts` — unit tests for helpers + integration assertions per "Testing strategy".
3. Write `starter.ts` — `// Docs:` header with canonical `platform.claude.com` URLs; exports stub helpers that `throw new Error("TODO: ...")`; exports `default async function run()`.
4. `AIDEV_TARGET=starter bun test ./tests.test.ts` — **MUST FAIL** (TDD red gate).
5. Write `solution.ts` — full implementation; model `claude-haiku-4-5-20251001` where applicable.
6. `AIDEV_TARGET=solution bun test ./tests.test.ts` — **MUST GREEN** against real Voyage + Anthropic APIs.
7. Write `es/exercise.md` and `en/exercise.md` — 6 required sections each.
8. Write `meta.json` — `id`, `track: "04-rag"`, `locales: ["es","en"]`, `valid_until: "2026-10-15"`, `concepts`, `estimated_minutes`, `requires`.
9. Conventional commit: `feat(exercises/04-rag): add 0N-<slug>`.

**After all 5 exercises land**:

10. From `code/`: `bun test` (full suite) + `bunx tsc --noEmit` — both green.
11. `bun run packages/cli/src/index.ts list` — confirm `04-rag` renders with all 5 exercises (both locales).
12. Push.

## Open questions

1. **Test concurrency vs Voyage rate limits**. Bun's default parallel test runner may saturate Voyage's per-minute budget when multiple integration test files run simultaneously. Decision deferred to apply phase — if flakes materialize, either serialize integration tests via `describe.serial` or introduce a 250ms throttle. No code changes required at design time.
2. **Citation format in 05 — freeform vs strict JSON**. Locked to strict JSON envelope per ADR-9. If Haiku proves unreliable at this model/temperature combo during apply, we may relax to regex extraction; revisit in verify.
