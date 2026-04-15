# Tasks: add-rag-track

Change: `add-rag-track`
Phase: tasks
Total: 65 tasks across 7 batches (Batch 0 + Batches 1–5 + Batch 6)
Strict TDD: ENABLED — tests-first always, solution only written after FAIL confirmed.

---

## Batch 0 — Shared fixture (4 tasks)

- [ ] B0-T01: Create dir `code/packages/exercises/04-rag/fixtures/`
- [ ] B0-T02: Write `code/packages/exercises/04-rag/fixtures/docs-chunks.ts` — export `Chunk` interface (`id: string`, `text: string`, `metadata: { source: "prompt-caching-docs"|"tool-use-docs"; topic: string; url: string }`); export `DOCS_CHUNKS: Chunk[]` array of ~15 chunks (~7 caching IDs `caching-01..07`, ~8 tool-use IDs `tooluse-01..08`), 150–300 tokens each, paraphrased from Anthropic docs, `metadata.url` → canonical `docs.claude.com` paths
- [ ] B0-T03: `bunx tsc --noEmit` from `code/` → zero errors
- [ ] B0-T04: Commit: `feat(exercises/04-rag): add shared docs-chunks fixture`

---

## Batch 1 — 01-embeddings-basics (11 tasks)

- [ ] B1-T01: Create dirs `code/packages/exercises/04-rag/01-embeddings-basics/`, `es/`, `en/`
- [ ] B1-T02: Write `tests.test.ts` — unit (no API): `cosineSimilarity([1,0],[1,0]) === 1`; `cosineSimilarity([1,0],[0,1]) === 0`; integration (`beforeAll` guard `VOYAGE_API_KEY`): `embed(["hello"], "document")` returns `number[][]` of length 1 with inner length 1024; similar texts cosine > 0.5; dissimilar texts cosine < 0.5; `run()` returns `{embedding: number[], dimension: 1024, similarityScore: number}`
- [ ] B1-T03: Write `starter.ts` — `// Docs: https://docs.voyageai.com/reference/embeddings` header; export `embed(texts: string[], inputType: "document"|"query"): Promise<number[][]>` (TODO throw); export `cosineSimilarity(a: number[], b: number[]): number` (TODO throw); export default `run(): Promise<{embedding: number[], dimension: number, similarityScore: number}>` (TODO throw)
- [ ] B1-T04: `AIDEV_TARGET=starter bun test packages/exercises/04-rag/01-embeddings-basics` from `code/` → confirm FAIL
- [ ] B1-T05: Write `solution.ts` — inline `voyageEmbed` fetch client (model `voyage-3.5-lite`, `input_type` param); implement `embed` wrapping `voyageEmbed`; implement `cosineSimilarity` as dot product (valid since Voyage L2-normalizes); `run()` embeds a "What is prompt caching?" query + a similar text + a dissimilar text, returns first embedding, dimension, similarity score; no Anthropic API call (pure embeddings exercise)
- [ ] B1-T06: `AIDEV_TARGET=solution bun test packages/exercises/04-rag/01-embeddings-basics` from `code/` → GREEN
- [ ] B1-T07: Write `es/exercise.md` — 6 sections: Objetivo, Contexto, Tu tarea, Pistas (input_type asymmetry, dot product válido por L2-norm, modelo voyage-3.5-lite), Criterios de éxito, Recursos
- [ ] B1-T08: Write `en/exercise.md` — 6 equivalent sections in English
- [ ] B1-T09: Write `meta.json` — `{"id":"01-embeddings-basics","track":"04-rag","title":"Embeddings Basics","version":"1.0.0","valid_until":"2026-10-15","concepts":["embeddings","cosine-similarity","input-type-asymmetry","voyage-api"],"estimated_minutes":20,"requires":["01-first-call"],"locales":["es","en"],"model_cost_hint":"voyage-only"}`
- [ ] B1-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "01-embeddings-basics" appears under `04-rag`
- [ ] B1-T11: Commit: `feat(exercises/04-rag/01-embeddings-basics): add embeddings basics exercise`

---

## Batch 2 — 02-vector-search (11 tasks)

- [ ] B2-T01: Create dirs `code/packages/exercises/04-rag/02-vector-search/`, `es/`, `en/`
- [ ] B2-T02: Write `tests.test.ts` — integration (`beforeAll` guard `VOYAGE_API_KEY`): `buildIndex(DOCS_CHUNKS)` returns array of length 15, each entry has `embedding: number[]` of length 1024; `search(index, "how does prompt caching work?", 3)` returns 3 results ordered by descending score; soft-semantic: `results.map(r => r.chunk.metadata.topic).join("|")` matches `/cache|cache-control|ttl/i`; `run()` returns top-3 `RankedChunk[]`
- [ ] B2-T03: Write `starter.ts` — `// Docs: https://docs.voyageai.com/reference/embeddings` header; import `Chunk`, `DOCS_CHUNKS` from `../fixtures/docs-chunks.ts`; export `IndexedChunk` interface (extends `Chunk` + `embedding: number[]`); export `buildIndex(chunks: Chunk[]): Promise<IndexedChunk[]>` (TODO throw); export `search(index: IndexedChunk[], query: string, topK: number): Promise<{chunk: IndexedChunk; score: number}[]>` (TODO throw); export default `run()` (TODO throw)
- [ ] B2-T04: `AIDEV_TARGET=starter bun test packages/exercises/04-rag/02-vector-search` from `code/` → FAIL
- [ ] B2-T05: Write `solution.ts` — `buildIndex` calls `voyageEmbed(chunks.map(c => c.text), "document")`; `search` embeds query with `"query"` input_type, computes `cosineSimilarity` against all index entries, returns topK sorted descending; `run()` builds index from `DOCS_CHUNKS`, searches "What is prompt caching TTL?", returns top-3
- [ ] B2-T06: `AIDEV_TARGET=solution bun test packages/exercises/04-rag/02-vector-search` from `code/` → GREEN
- [ ] B2-T07: Write `es/exercise.md` — 6 sections: hint on `"document"` vs `"query"` input_type asymmetry, nota sobre O(n) scan pedagógico, explicación del test soft-semantic, Criterios de éxito, Recursos
- [ ] B2-T08: Write `en/exercise.md` — 6 sections in English
- [ ] B2-T09: Write `meta.json` — `{"id":"02-vector-search","track":"04-rag","title":"Vector Search","version":"1.0.0","valid_until":"2026-10-15","concepts":["vector-index","cosine-similarity","input-type-asymmetry","in-memory-search"],"estimated_minutes":25,"requires":["01-embeddings-basics"],"locales":["es","en"],"model_cost_hint":"voyage-only"}`
- [ ] B2-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "02-vector-search" under `04-rag`
- [ ] B2-T11: Commit: `feat(exercises/04-rag/02-vector-search): add vector search exercise`

---

## Batch 3 — 03-chunking-strategies (11 tasks)

- [ ] B3-T01: Create dirs `code/packages/exercises/04-rag/03-chunking-strategies/`, `es/`, `en/`
- [ ] B3-T02: Write `tests.test.ts` — UNIT ONLY (no API, no `beforeAll` guard): `chunk("", {size:100,overlap:0})` returns `[]`; text shorter than size → length 1; overlap produces expected window boundaries; size > text length → 1 chunk; `run()` returns `{fixed: string[], sentence: string[], paragraph: string[]}` with all arrays non-empty (use a multi-sentence multi-paragraph test string); `~$0.000` cost, no keys required
- [ ] B3-T03: Write `starter.ts` — `// Docs: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips` header; export `chunk(text: string, options: {size: number; overlap: number}): string[]` (TODO throw — fixed-size sliding window); export default `run(): Promise<{fixed: string[], sentence: string[], paragraph: string[]}>` (TODO throw — demonstrates 3 strategies on sample text)
- [ ] B3-T04: `AIDEV_TARGET=starter bun test packages/exercises/04-rag/03-chunking-strategies` from `code/` → FAIL
- [ ] B3-T05: Write `solution.ts` — `chunk()`: fixed sliding window splitting by character count with overlap; `run()`: applies fixed (size 200 overlap 50), sentence (split on `.!?`+trim), and paragraph (split on `\n\n`+trim) strategies to a sample paragraph from `DOCS_CHUNKS[0].text`; returns `{fixed, sentence, paragraph}`; zero API calls
- [ ] B3-T06: `AIDEV_TARGET=solution bun test packages/exercises/04-rag/03-chunking-strategies` from `code/` → GREEN
- [ ] B3-T07: Write `es/exercise.md` — 6 sections: por qué importa el chunking, 3 estrategias comparadas, mecánica del overlap, nota de costo $0 (pure computation), puntero a pgvector/Pinecone para producción
- [ ] B3-T08: Write `en/exercise.md` — 6 sections in English
- [ ] B3-T09: Write `meta.json` — `{"id":"03-chunking-strategies","track":"04-rag","title":"Chunking Strategies","version":"1.0.0","valid_until":"2026-10-15","concepts":["fixed-size-chunking","sentence-chunking","paragraph-chunking","overlap","chunk-size-tradeoffs"],"estimated_minutes":20,"requires":["02-vector-search"],"locales":["es","en"],"model_cost_hint":"none"}`
- [ ] B3-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "03-chunking-strategies" under `04-rag`
- [ ] B3-T11: Commit: `feat(exercises/04-rag/03-chunking-strategies): add chunking strategies exercise`

---

## Batch 4 — 04-retrieval-pipeline (11 tasks)

- [ ] B4-T01: Create dirs `code/packages/exercises/04-rag/04-retrieval-pipeline/`, `es/`, `en/`
- [ ] B4-T02: Write `tests.test.ts` — integration (`beforeAll` guard BOTH `VOYAGE_API_KEY` AND `ANTHROPIC_API_KEY`); uses `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET`; `runUserCode()` → `calls.length === 1`; `calls[0].request.model` matches `/haiku/i`; `calls[0].request.system` contains verbatim text from at least one retrieved chunk; `userReturn.retrieved.length === 3`; `userReturn.answer` is non-empty string; `userReturn.usage.embedTokens` is a positive number
- [ ] B4-T03: Write `starter.ts` — `// Docs: https://docs.voyageai.com/reference/embeddings` + `// Docs: https://docs.claude.com/en/api/messages` headers; import `DOCS_CHUNKS` + `IndexedChunk` from sibling paths; export `retrieveAndGenerate(query: string, index: IndexedChunk[], topK: number): Promise<{answer: string; retrieved: IndexedChunk[]; usage: {embedTokens: number}}>` (TODO throw); export default `run()` (TODO throw — builds index, calls `retrieveAndGenerate` with "What is the TTL for prompt caching?", topK=3)
- [ ] B4-T04: `AIDEV_TARGET=starter bun test packages/exercises/04-rag/04-retrieval-pipeline` from `code/` → FAIL
- [ ] B4-T05: Write `solution.ts` — `retrieveAndGenerate`: embed query with `"query"`, search index for topK, build system prompt prepending each retrieved chunk's text, call `anthropic.messages.create` (model `claude-haiku-4-5-20251001`, max_tokens 512), return `{answer, retrieved, usage: {embedTokens}}`; `run()`: `buildIndex(DOCS_CHUNKS)` then `retrieveAndGenerate("What is the TTL for prompt caching?", index, 3)`
- [ ] B4-T06: `AIDEV_TARGET=solution bun test packages/exercises/04-rag/04-retrieval-pipeline` from `code/` → GREEN
- [ ] B4-T07: Write `es/exercise.md` — 6 sections: diagrama del pipeline completo en texto (embed→search→prompt→generate), hint sobre construcción del system prompt, por qué la query TTL mapea a caching-docs, nota de que Voyage usage no lo captura el harness
- [ ] B4-T08: Write `en/exercise.md` — 6 sections in English
- [ ] B4-T09: Write `meta.json` — `{"id":"04-retrieval-pipeline","track":"04-rag","title":"Retrieval Pipeline","version":"1.0.0","valid_until":"2026-10-15","concepts":["rag-pipeline","retrieval-augmented-generation","system-prompt-construction","embed-then-generate"],"estimated_minutes":30,"requires":["03-chunking-strategies"],"locales":["es","en"],"model_cost_hint":"haiku"}`
- [ ] B4-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "04-retrieval-pipeline" under `04-rag`
- [ ] B4-T11: Commit: `feat(exercises/04-rag/04-retrieval-pipeline): add retrieval pipeline exercise`

---

## Batch 5 — 05-citations-grounding (11 tasks)

- [ ] B5-T01: Create dirs `code/packages/exercises/04-rag/05-citations-grounding/`, `es/`, `en/`
- [ ] B5-T02: Write `tests.test.ts` — unit (no API): `parseJsonResponse('{"answer":"x","citations":["a"]}')` succeeds; `parseJsonResponse('```json\n{"answer":"x","citations":["a"]}\n```')` succeeds (markdown-fence strip); `parseJsonResponse("not json")` throws; integration (`beforeAll` guard BOTH keys): `runUserCode()` → `calls.length === 1`; model `/haiku/i`; `calls[0].request.system` includes JSON format instruction (matches `/citations|json/i`); `userReturn.citations` is non-empty `string[]`; each citation id appears in `userReturn.retrieved.map(r => r.id)`; `userReturn.answer` non-empty
- [ ] B5-T03: Write `starter.ts` — `// Docs: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags` + `// Docs: https://docs.voyageai.com/reference/embeddings` headers; export `parseJsonResponse<T>(text: string): T` (TODO throw — tolerant parser, strips markdown fences); export `generateWithCitations(query: string, chunks: IndexedChunk[]): Promise<{answer: string; citations: string[]; retrieved: IndexedChunk[]}>` (TODO throw); export default `run()` (TODO throw)
- [ ] B5-T04: `AIDEV_TARGET=starter bun test packages/exercises/04-rag/05-citations-grounding` from `code/` → FAIL
- [ ] B5-T05: Write `solution.ts` — `parseJsonResponse<T>`: strips ` ```json ` fences if present, `JSON.parse`, throws with raw LLM text in error on failure; `generateWithCitations`: build index from `DOCS_CHUNKS`, search query (topK=3), system prompt instructs Haiku to respond ONLY with `{"answer":"...","citations":["chunk-id-1",...]}` JSON, call `messages.create` (model `claude-haiku-4-5-20251001`), `parseJsonResponse`, validate each citation id exists in retrieved; `run()` queries "What formats does Claude support for tool use input?"
- [ ] B5-T06: `AIDEV_TARGET=solution bun test packages/exercises/04-rag/05-citations-grounding` from `code/` → GREEN
- [ ] B5-T07: Write `es/exercise.md` — 6 sections: hint sobre phrasing del system prompt JSON, por qué parser tolerante (LLM a veces envuelve en fences), importancia de validar citation ids, nota ADR-9 (strict JSON, regex fallback descartado), puntero a enfoques de producción
- [ ] B5-T08: Write `en/exercise.md` — 6 sections in English
- [ ] B5-T09: Write `meta.json` — `{"id":"05-citations-grounding","track":"04-rag","title":"Citations & Grounding","version":"1.0.0","valid_until":"2026-10-15","concepts":["citations","grounding","json-output","tolerant-parser","hallucination-prevention"],"estimated_minutes":35,"requires":["04-retrieval-pipeline"],"locales":["es","en"],"model_cost_hint":"haiku"}`
- [ ] B5-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "05-citations-grounding" under `04-rag`
- [ ] B5-T11: Commit: `feat(exercises/04-rag/05-citations-grounding): add citations and grounding exercise`

---

## Batch 6 — Final validation (6 tasks)

- [ ] B6-T01: `bunx tsc --noEmit` from `code/` → zero TypeScript errors
- [ ] B6-T02: `bun test packages/cli packages/runner` from `code/` → non-integration suite GREEN (expect ~104 pass, 0 fail)
- [ ] B6-T03: `AIDEV_TARGET=solution bun test packages/exercises/04-rag/` from `code/` → all 5 integration suites GREEN (requires both `ANTHROPIC_API_KEY` and `VOYAGE_API_KEY`)
- [ ] B6-T04: `bun packages/cli/src/index.ts list` from `code/` → visually confirm all 5 exercises under `04-rag` with correct titles; check both `--locale es` and `--locale en`
- [ ] B6-T05: `git log --oneline -10` → confirm 6 commits (fixture + 5 exercises) with `feat(exercises/04-rag/...)` conventional format; no Co-Authored-By lines
- [ ] B6-T06: Check CONTRIBUTING.md — add a short section noting `VOYAGE_API_KEY` is required for track `04-rag` exercises (all 5 exercises need Voyage; 04 and 05 additionally need `ANTHROPIC_API_KEY`); commit `docs(contributing): add VOYAGE_API_KEY note for 04-rag track`
