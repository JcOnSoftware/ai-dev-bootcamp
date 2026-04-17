# Exercise 04 — Chunking a long document for retrieval

## Concept

A 700-word article embedded as ONE vector is a blend of everything it covers — mitochondria, photosynthesis, disease, the Krebs cycle. The vector's direction is an "average" of all those topics. When you query about ONE of them (say, Parkinson's disease), the average-vector score is mediocre because the other topics dilute the signal.

The fix: **chunk** the document into smaller pieces, embed each chunk separately, then retrieve at chunk granularity. Each chunk stays topically coherent, so its vector points sharply at one subject. Retrieval surfaces the relevant chunk — not the whole article.

**Chunking strategies** range from naive to smart:

| Strategy | How | When |
|---|---|---|
| Fixed-size | Every 500 chars | Simplest, but breaks mid-sentence |
| Sentence split | `.split(/\\. /)` | Cleaner, but loses cross-sentence context |
| **Paragraph split** | `.split(/\\n\\n/)` | Matches human structure — usually the right default |
| Sliding window + overlap | 500-char windows with 50-char overlap | Preserves context across boundaries |
| Semantic chunking | Group sentences by similarity | Highest quality, most compute |

For this exercise we use paragraph split (one paragraph = one chunk) because the article uses blank lines. Good defaults.

## Docs & references

1. [Embeddings tips for quality search](https://ai.google.dev/gemini-api/docs/embeddings#tips-for-quality-search) — chunk size, overlap, task types
2. [`embedContent` batched](https://ai.google.dev/api/embeddings) — `contents: string[]` returns one embedding per chunk
3. [RAG overview](https://ai.google.dev/gemini-api/docs/embeddings#retrieval-augmented-generation) — why chunk-level retrieval beats doc-level

## Your task

1. Call `chunkByParagraph(ARTICLE)` — should yield **4 paragraphs**.
2. Embed all chunks with `config.taskType: "RETRIEVAL_DOCUMENT"` (one call, `contents: chunks`).
3. Embed the query `"What disease is linked to broken mitochondria?"` with `config.taskType: "RETRIEVAL_QUERY"`.
4. For every chunk, compute `cosineSimilarity(queryVec, chunkVec)`.
5. Return an array of `{ id, text, score }` sorted DESCENDING by score (return ALL chunks so you can eyeball the ranking).

## How to verify

```bash
aidev verify 04-chunking
```

Tests check:
- At least 2 `embedContent` calls
- The corpus call used an array `contents` (batched)
- Return has exactly 4 chunks
- Each chunk has `{ id: number, text: string, score: number }`
- Sorted descending by score
- **Top chunk mentions Parkinson's or Alzheimer's** (the disease paragraph) — the correct retrieval target

## Extra concept (optional)

**Overlap** helps when the answer spans a paragraph boundary — e.g., "in summary" appears at the end of paragraph 2 and the actual summary starts paragraph 3. A sliding window with, say, 10% overlap keeps some context on both sides of the cut.

For production systems with tens of thousands of docs, embedding + reranking becomes its own pipeline stage: (1) cheap initial retrieval via ANN index, (2) slower but more accurate rerank on the top-50 using a cross-encoder model. Gemini also exposes a **reranker** endpoint via the `ranking` API — worth exploring in real systems.

Don't forget: chunk-level retrieval doesn't preserve document identity. Store `(doc_id, chunk_id, text, vector)` so you know which original doc produced each chunk — you'll want that for citations in exercise 05.
