# Spec: add-rag-track

Change: `add-rag-track`
Track slug: `04-rag`
Embedding model: `voyage-3.5-lite` (via raw `fetch`)
Generation model: `claude-haiku-4-5-20251001`
Status: spec
Date: 2026-04-15

---

## Shared fixture contract

**Path**: `code/packages/exercises/04-rag/fixtures/docs-chunks.ts`

```ts
export interface Chunk {
  id: string;          // e.g. "caching-01"
  content: string;     // 150–300 tokens of Anthropic docs content (paraphrased/excerpted)
  metadata: {
    source: string;    // "prompt-caching" | "tool-use"
    topic: string;     // e.g. "cache_control basics"
    url: string;       // canonical docs.claude.com URL
  };
}

export const DOCS_CHUNKS: Chunk[];  // ~15 chunks covering prompt-caching + tool-use topics
```

**Content sourcing**: Paraphrase/excerpt from canonical Anthropic docs at `docs.claude.com`. Each chunk must be self-contained — a learner reading it in isolation must understand the concept without surrounding context. No pre-computed embeddings stored here; exercises compute them at runtime.

**Chunk topics to cover (~15 total)**:
- `cache_control` basics (what it is, where to place the header)
- Prompt caching TTLs (5-minute vs 1-hour)
- Cache cost model (write multiplier, read discount)
- Prompt caching breakeven / when to use
- Prompt caching + tool definitions pattern
- `tool_use` block structure (id, name, input)
- `tool_result` block structure (tool_use_id, content, is_error)
- Tool loop pattern (2-turn sequence)
- Parallel tool use (multiple `tool_use` in one response)
- `tool_choice` variants (auto / any / tool / none)
- `input_schema` JSON Schema shape (type, properties, required)
- Streaming tool use
- Token counting overview
- RAG overview / context window trade-offs
- Haiku use cases (latency-sensitive, classification)

---

## Helper / API contract per exercise

### `01-embeddings-basics`

**Goal**: Learn the Voyage embeddings HTTP contract, L2-normalization insight, and dot product == cosine for normalized vectors.

**Named exports**:

```ts
// POST https://api.voyageai.com/v1/embeddings with voyage-3.5-lite
export async function embed(
  text: string,
  inputType: "document" | "query"
): Promise<number[]>;

// Dot product (valid == cosine because Voyage L2-normalizes all vectors)
export function cosineSimilarity(a: number[], b: number[]): number;

// Embed two sample sentences, compute similarity
export default async function run(): Promise<{
  embedding: number[];
  dimension: number;
  similarityScore: number;
}>;
```

**Voyage request shape**:
```json
{
  "input": ["<text>"],
  "model": "voyage-3.5-lite",
  "input_type": "document" | "query"
}
```
**Voyage response shape**: `{ data: [{ embedding: number[], index: number }], model: string, usage: { total_tokens: number } }`

**Assertions — unit (no API)**:
- `cosineSimilarity([1,0,0], [1,0,0]) === 1`
- `cosineSimilarity([1,0,0], [0,1,0]) === 0`
- `cosineSimilarity([1,0,0], [-1,0,0]) === -1`
- Property: `Math.abs(cosineSimilarity(v, v) - 1) < 1e-9` for any unit vector `v`

**Assertions — integration (real Voyage)**:
- `embedding.length === 1024`
- `dimension === 1024`
- Similarity between `embed("hello world", "query")` and `embed("hello world", "document")` > 0.7 (vectors differ by `input_type` but semantically close)
- `run()` returns shape `{ embedding: number[], dimension: 1024, similarityScore: number }`

---

### `02-vector-search`

**Goal**: Build an in-memory vector index from a corpus and implement top-K semantic search with the `input_type` asymmetry (`"document"` for indexing, `"query"` for searching).

**Types**:
```ts
interface IndexedChunk extends Chunk { embedding: number[] }
interface RankedChunk extends IndexedChunk { score: number }
```

**Named exports**:
```ts
// Embed all chunks with input_type:"document", return chunks + embeddings
export async function buildIndex(chunks: Chunk[]): Promise<IndexedChunk[]>;

// Embed query with input_type:"query", rank by dot product, return top-K descending
export async function search(
  query: string,
  index: IndexedChunk[],
  topK: number
): Promise<RankedChunk[]>;

export default async function run(): Promise<RankedChunk[]>;
// run() indexes DOCS_CHUNKS, searches "how do I cache tool definitions?", returns top-3
```

**Assertions — unit (no API)**:
- `buildIndex([])` resolves to `[]`
- `search("x", [], 5)` resolves to `[]`
- `search(q, index, 3)` returns array of length `<= 3` sorted by `score` descending (score[i] >= score[i+1])

**Assertions — integration (real Voyage)**:
- `buildIndex(DOCS_CHUNKS)` returns array of length `DOCS_CHUNKS.length`; every item has `.embedding.length === 1024`
- `run()` returns array of length 3
- Top chunk for `"how do I cache tool definitions?"` has `metadata.topic` containing `"cache"` or `"tool"` (case-insensitive soft semantic check — NOT a literal string assertion)
- Every `RankedChunk` in `run()` output has `metadata.source` equal to `"prompt-caching"` or `"tool-use"`

---

### `03-chunking-strategies`

**Goal**: Implement three chunking strategies and understand the size/overlap tradeoff before retrieval quality analysis.

**Types**:
```ts
// Chunking result uses the same Chunk interface but `id` can be auto-generated (e.g. "chunk-0")
// and `metadata` fields may be empty strings for chunking exercises
```

**Named exports**:
```ts
export function chunk(
  text: string,
  strategy: "fixed" | "sentence" | "paragraph",
  options?: { size?: number; overlap?: number }
): Chunk[];

export default async function run(): Promise<{
  fixed:     { count: number; avgSize: number; smallest: number; largest: number };
  sentence:  { count: number; avgSize: number; smallest: number; largest: number };
  paragraph: { count: number; avgSize: number; smallest: number; largest: number };
}>;
```

**Strategy semantics**:
- `"fixed"`: Split by character count. `size` (default 200) = chunk size in chars. `overlap` (default 0) = char overlap between consecutive chunks. Last chunk may be shorter.
- `"sentence"`: Split on sentence-ending punctuation (`[.!?]+\s`). `overlap` = number of sentences to carry over (default 0). Trim whitespace from each chunk.
- `"paragraph"`: Split on double-newline (`\n\n`). Trim whitespace. No overlap concept (ignore `overlap` option if passed).

**Assertions — unit (no API)**:
- `chunk("", "fixed")` returns `[]`
- `chunk("", "sentence")` returns `[]`
- `chunk("", "paragraph")` returns `[]`
- `chunk(text500chars, "fixed", { size: 100, overlap: 20 })`: each chunk (except last) has length ~100 chars; consecutive chunks share a ~20-char suffix/prefix overlap
- `chunk("A. B. C.", "sentence")` returns 3 chunks with content `"A."`, `"B."`, `"C."`
- `chunk("P1\n\nP2", "paragraph")` returns 2 chunks with content `"P1"` and `"P2"`
- `chunk("One sentence.", "paragraph")` returns 1 chunk

**Assertions — integration** (minimal — chunking is pure):
- `run()` returns shape `{ fixed: {...}, sentence: {...}, paragraph: {...} }` where each value has `count`, `avgSize`, `smallest`, `largest` (all numbers)
- `run().fixed.count >= 1`

---

### `04-retrieval-pipeline`

**Goal**: Assemble the full RAG pipeline — embed query, retrieve top-K, stuff context into Haiku system prompt, return answer + retrieved chunks + combined usage.

**Types**:
```ts
interface ClaudeUsage { input_tokens: number; output_tokens: number }

interface RetrievalResult {
  answer: string;
  retrieved: RankedChunk[];
  usage: {
    embedTokens: number;      // from Voyage response.usage.total_tokens
    claudeTokens: ClaudeUsage;
  };
}
```

**Named exports**:
```ts
export async function retrieveAndGenerate(
  query: string,
  index: IndexedChunk[],
  topK: number
): Promise<RetrievalResult>;

export default async function run(): Promise<RetrievalResult>;
// run(): index DOCS_CHUNKS, call retrieveAndGenerate with:
//   query = "What's the difference between 5-minute and 1-hour cache TTL?"
//   topK = 3
```

**System prompt contract**: The system prompt passed to Haiku MUST include the retrieved chunks verbatim or near-verbatim (sufficient that a distinctive phrase from any top-3 chunk appears in the `system` field of the request). The system prompt MUST instruct Claude to answer using ONLY the provided context.

**Assertions — integration (real Voyage + real Haiku)**:
- `result.userReturn.answer.length > 50`
- `result.userReturn.retrieved.length === 3`
- `result.userReturn.retrieved[0].score > result.userReturn.retrieved[1].score` (ordered descending)
- `result.calls[0].request.system` contains a distinctive substring from one of the top-3 retrieved chunks (pick a phrase ≥ 8 chars that appears verbatim in the fixture — checked at test-write time)
- `result.calls[0].request.model` matches `/haiku/i`
- `result.userReturn.usage.embedTokens > 0`
- `result.userReturn.usage.claudeTokens.input_tokens > 0`

Note: `result.calls` captures only Anthropic SDK calls. Voyage calls are not in `result.calls` — Voyage usage is returned in `RetrievalResult.usage.embedTokens`.

---

### `05-citations-grounding`

**Goal**: Force Claude to output structured citations referencing chunks by id, then parse and validate grounding.

**Types**:
```ts
interface Citation { chunkId: string; quotedText: string }

interface CitationResult {
  answer: string;
  citations: Citation[];
}
```

**Named exports**:
```ts
export async function generateWithCitations(
  query: string,
  chunks: RankedChunk[]
): Promise<CitationResult>;

export default async function run(): Promise<CitationResult>;
// run(): index DOCS_CHUNKS, search same query as 04, pass top-3 to generateWithCitations
```

**Prompt strategy**: System prompt must instruct Claude to return ONLY a JSON object matching:
```json
{
  "answer": "...",
  "citations": [{ "chunkId": "...", "quotedText": "..." }]
}
```
No prose outside the JSON. Parse the response with `JSON.parse`. Validate that every `chunkId` exists in the input `chunks` array.

**Assertions — integration (real Voyage + real Haiku)**:
- `result.userReturn.citations.length >= 1`
- Every `citation.chunkId` in `result.userReturn.citations` exists in the input `chunks` array (checked against `chunk.id`)
- `result.userReturn.answer.length > 30`
- `result.calls[0].request.system` includes a string matching `/citation/i` or `/chunkId/i` (confirms citation instruction was sent)
- `result.calls[0].request.model` matches `/haiku/i`
- `JSON.parse` of the raw response text does NOT throw (valid JSON output)

---

## Starter contract

Each `starter.ts`:

1. Begins with a `// Docs:` comment block including canonical URLs:
   ```ts
   // Docs:
   //   Embeddings (Voyage via Anthropic) : https://docs.claude.com/en/docs/build-with-claude/embeddings
   //   Voyage Embeddings API             : https://docs.voyageai.com/reference/embeddings-api
   ```
   Exercises 04 and 05 add:
   ```ts
   //   Messages API                      : https://docs.claude.com/en/api/messages
   ```

2. Exports all named helpers as TODO-throwing stubs with correct signatures:
   ```ts
   export async function embed(text: string, inputType: "document" | "query"): Promise<number[]> {
     throw new Error("TODO: implementa embed() — lee el ejercicio en es/exercise.md");
   }
   ```

3. Exports `default async function run()` that throws TODO.

4. Is locale-neutral — no Spanish/English prose inline.

5. Uses `fetch` directly (no `voyageai` npm package).

---

## Test structure

### Guard pattern (ALL test files)

```ts
beforeAll(() => {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.VOYAGE_API_KEY) {
    throw new Error("Integration tests require ANTHROPIC_API_KEY and VOYAGE_API_KEY");
  }
  if (!process.env.VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY is required for embedding tests");
  }
  // Exercises 01-03: ANTHROPIC_API_KEY not needed; exercises 04-05: guard both
});
```

Exercises 01-03 only guard `VOYAGE_API_KEY`. Exercises 04-05 guard both keys.

### Test organization per file

```
tests.test.ts
├── describe("unit — <helper>", () => { ... })   // no API calls
└── describe("integration — <helper>", () => {   // real API
      beforeAll(() => { /* guard keys */ });
      test("...", async () => { ... });
    })
```

### Assertion patterns

- Use `Array.find(b => ...)` — never positional index access on arrays with non-deterministic order.
- Use `/haiku/i` regex for model name assertions.
- Semantic assertions use case-insensitive substring checks, not exact string equality.
- Never assert on literal LLM text output.
- `toBeCloseTo` for floating point similarity scores where relevant.

---

## Track structure

### Directory layout

```
code/packages/exercises/04-rag/
├── fixtures/
│   └── docs-chunks.ts
├── 01-embeddings-basics/
│   ├── es/exercise.md
│   ├── en/exercise.md
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   └── meta.json
├── 02-vector-search/
│   └── (same structure)
├── 03-chunking-strategies/
│   └── (same structure)
├── 04-retrieval-pipeline/
│   └── (same structure)
└── 05-citations-grounding/
    └── (same structure)
```

### `meta.json` fields per exercise

| Field | Value |
|---|---|
| `id` | directory name (e.g. `"01-embeddings-basics"`) |
| `track` | `"04-rag"` |
| `title` | Human-readable, matches exercise.md H1 |
| `version` | `"1.0.0"` |
| `valid_until` | `"2026-10-15"` |
| `locales` | `["es", "en"]` |
| `model_cost_hint` | see table below |

### `requires` dependency chain

| Exercise | `requires` |
|---|---|
| `01-embeddings-basics` | `["01-first-call"]` |
| `02-vector-search` | `["01-embeddings-basics"]` |
| `03-chunking-strategies` | `["02-vector-search"]` |
| `04-retrieval-pipeline` | `["03-chunking-strategies"]` |
| `05-citations-grounding` | `["04-retrieval-pipeline"]` |

### `concepts` tags per exercise

| Exercise | `concepts` |
|---|---|
| `01-embeddings-basics` | `["embeddings", "voyage-ai", "cosine-similarity", "l2-normalization", "input-type"]` |
| `02-vector-search` | `["vector-index", "top-k-search", "input-type-asymmetry", "ranked-retrieval"]` |
| `03-chunking-strategies` | `["chunking", "fixed-size", "sentence-splitting", "paragraph-splitting", "overlap"]` |
| `04-retrieval-pipeline` | `["rag-pipeline", "context-stuffing", "haiku-generation", "embed-then-generate"]` |
| `05-citations-grounding` | `["citations", "grounding", "json-output", "hallucination-mitigation", "structured-prompting"]` |

### `estimated_minutes` per exercise

| Exercise | Minutes |
|---|---|
| `01-embeddings-basics` | 20 |
| `02-vector-search` | 25 |
| `03-chunking-strategies` | 30 |
| `04-retrieval-pipeline` | 35 |
| `05-citations-grounding` | 35 |

### `model_cost_hint` per exercise

| Exercise | Hint |
|---|---|
| `01-embeddings-basics` | `"~$0.000 (Voyage free tier — 2 embed calls)"` |
| `02-vector-search` | `"~$0.000 (Voyage free tier — 16 embed calls for fixture + 1 query)"` |
| `03-chunking-strategies` | `"~$0.000 (pure computation, no API calls)"` |
| `04-retrieval-pipeline` | `"~$0.005 (Voyage free tier + Haiku 4.5 generation)"` |
| `05-citations-grounding` | `"~$0.005 (Voyage free tier + Haiku 4.5 generation)"` |

### CLI discovery

No changes to `code/packages/cli/src/exercises.ts` — it already discovers tracks dynamically via directory scan and groups by track slug.

---

## Exercise.md structure

All `exercise.md` files (both `es/` and `en/`) MUST follow the 6-section contract:

1. **`# Exercise <NN> — <title>`** — H1 matching `meta.json.title`
2. **`## Concepto`** / **`## Concept`** — What to understand before touching code. 2–4 paragraphs. No code.
3. **`## Docs & referencias`** / **`## Docs & references`** — Official links only, numbered, one-line summary each. Canonical `docs.claude.com/...` URLs.
4. **`## Tu tarea`** / **`## Your task`** — Step-by-step implementation guide for `starter.ts`.
5. **`## Cómo verificar`** / **`## How to verify`** — `aidev verify <id>` command + bullet list of what tests check.
6. **`## Concepto extra (opcional)`** / **`## Extra concept (optional)`** — Optional deepening, nothing tests depend on.

### Canonical doc URLs to use

- Embeddings: `https://docs.claude.com/en/docs/build-with-claude/embeddings`
- Voyage Embeddings API: `https://docs.voyageai.com/reference/embeddings-api`
- Messages API: `https://docs.claude.com/en/api/messages`
- Prompt Caching: `https://docs.claude.com/en/docs/build-with-claude/prompt-caching`
- Tool Use: `https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview`

### `## Concepto` / `## Concept` content hints per exercise

**`01-embeddings-basics`**:
- Explain that embedding converts text to a point in a high-dimensional space where semantic proximity = geometric proximity.
- Explain L2-normalization: Voyage normalizes all vectors to unit length, making dot product numerically identical to cosine similarity (dot product of unit vectors = cos(θ) between them). Learner must understand WHY `cosineSimilarity` can be implemented as a simple dot product.
- Explain `input_type` asymmetry: Voyage was trained with separate encoding for queries vs documents. Using the wrong `input_type` degrades retrieval quality. "document" for corpus, "query" for search — always.

**`02-vector-search`**:
- Emphasize `input_type` asymmetry again — this is the most common mistake in production RAG.
- Explain what an "index" is in this context: just an array of `{chunk + embedding}` pairs. No special data structure needed at this scale.
- Explain top-K ranking: compute similarity against all N chunks, sort descending, take first K. O(N) per query — sufficient for hundreds of chunks.

**`03-chunking-strategies`**:
- Explain the fundamental tension: too large → irrelevant context dilutes the retrieved passage; too small → no self-contained meaning per chunk.
- Fixed: predictable size, ignores semantic boundaries. Good for structured data.
- Sentence: respects natural language units. Works well for prose documents.
- Paragraph: best for documentation with clear logical breaks. Chunks contain complete ideas.
- Overlap exists to prevent concepts that straddle a boundary from being lost.

**`04-retrieval-pipeline`**:
- Emphasize: retrieval quality determines generation quality. If wrong chunks are retrieved, no amount of prompting fixes the answer.
- Explain context stuffing: the retrieved chunks become the "knowledge" Claude reasons over. Without RAG, Claude relies on training data (may be stale or absent); with RAG, Claude uses your authoritative source.
- Explain the usage accounting pattern: Voyage tokens and Claude tokens are separate billing dimensions.

**`05-citations-grounding`**:
- Explain citation hallucination risk: without forcing citations to reference specific chunk IDs, Claude may hallucinate plausible-sounding but fake citations.
- Explain JSON mode prompting: instruct Claude to return ONLY JSON, parse with `JSON.parse`, validate schema programmatically. No prose outside the JSON.
- Explain the grounding guarantee: if every `chunkId` in the response matches an actual chunk ID, the citation is provably grounded in the retrieved corpus.
- Mention that Claude's native citation API (beta) is an alternative — but this exercise uses explicit prompt engineering to teach the underlying pattern.

### `## Concepto extra` content hints per exercise

- **`01-embeddings-basics`**: Mention that `voyage-3.5` (non-lite) offers higher accuracy at higher cost. Mention `output_dimension` truncation for storage trade-offs. The 1024-dim vectors are not directly human-interpretable — PCA/UMAP visualizations are used for debugging embedding spaces.
- **`02-vector-search`**: Mention approximate nearest neighbor (ANN) indexes (HNSW, IVF) for scaling beyond hundreds of chunks. At < 10k chunks, linear scan is fast enough. At 100k+, you need a vector DB.
- **`03-chunking-strategies`**: Mention semantic chunking (embed each sentence, split when similarity drops) as a more advanced alternative. Also mention that chunk size should be calibrated against the model's context window and retrieval quality empirically.
- **`04-retrieval-pipeline`**: Mention re-ranking as a second-stage step (cross-encoder or Voyage `rerank-2`) to improve top-K precision before generation. Also mention query expansion (HyDE — generate a hypothetical answer, embed it as the query).
- **`05-citations-grounding`**: Mention that Claude 3.5+ has a native citations beta API (`"citations": {"enabled": true}`) that returns citation objects automatically. Also mention that `quotedText` length should be bounded to avoid model inserting entire chunks.

---

## Out of scope (delta)

The following are explicitly excluded from this change:

- No changes to `code/packages/runner/src/harness.ts`
- No changes to `code/packages/cli/src/` (any file)
- No changes to `cost.ts` (Voyage cost is inline + educational)
- No `voyageai` npm package (use raw `fetch`)
- No vector DBs (Pinecone, Weaviate, Qdrant, sqlite-vec, pgvector)
- No hybrid search (keyword + semantic), re-ranking, query expansion, HyDE, semantic caching
- No other embedding providers (OpenAI text-embedding-*, Cohere embed-*, Hugging Face)
- No evaluation metrics (RAGAs, MRR, NDCG, Hit Rate)
- No pre-computed embeddings in fixture
- No `voyage-4` or newer models (not yet on Anthropic canonical page as of spec date)
- No track-level README
- No multi-provider support
- No streaming in 04/05
