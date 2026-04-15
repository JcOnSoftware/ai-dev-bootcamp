# 01 — Embeddings Basics

## Concept

**Embeddings** are numerical representations of text as high-dimensional vectors (1024 floats in this case). Texts with similar meaning end up in nearby regions of the vector space. This makes them the foundation of RAG systems: you convert text to numbers, then use vector arithmetic to measure semantic similarity.

Voyage AI produces **L2-normalized** vectors (magnitude = 1). This means the **dot product** between two vectors is exactly equal to the **cosine similarity** — you don't need to divide by magnitudes, which simplifies the code considerably.

The `input_type` parameter is asymmetric:
- `"document"` → for corpus texts you want to index
- `"query"` → for the query you're searching with

Confusing the two degrades retrieval quality.

## Docs & references

- Voyage AI Embeddings API: <https://docs.voyageai.com/reference/embeddings>
- Voyage AI Models: <https://docs.voyageai.com/docs/embeddings>
- Estimated cost: $0.000 (voyage-3.5-lite model, included in 200M free tier)

## Your task

Implement three things in `starter.ts`:

1. **`embed(texts, inputType)`** — call the Voyage AI API using `fetch`:
   - URL: `https://api.voyageai.com/v1/embeddings`
   - Body: `{ input: texts, model: "voyage-3.5-lite", input_type: inputType }`
   - Auth: `Authorization: Bearer ${process.env.VOYAGE_API_KEY}`
   - Return `number[][]` — one embedding per input text

2. **`cosineSimilarity(a, b)`** — dot product of two L2-normalized vectors.
   Simply: `sum(a[i] * b[i])` for all `i`.

3. **`run()`** — demonstrate the concept:
   - Embed a query about prompt caching
   - Embed a similar and a dissimilar text (in the same call, for efficiency)
   - Return `{ embedding, dimension, similarityScore }`

## How to verify

```bash
# Verify your implementation
aidev verify 01-embeddings-basics

# See the reference solution
aidev verify 01-embeddings-basics --solution
```

## What the tests validate

**Unit tests (no API):**
- `cosineSimilarity([1,0], [1,0])` returns `1`
- `cosineSimilarity([1,0], [0,1])` returns `0`
- `cosineSimilarity([1,0], [-1,0])` returns `-1`

**Integration tests (real API):**
- `embed(["hello world"], "document")` returns an array of length 1
- Each vector has dimension 1024
- Similar texts have cosine similarity > 0.5
- Dissimilar texts have cosine similarity < 0.8
- `run()` returns the shape `{ embedding: number[], dimension: 1024, similarityScore: number }`

## Extra concept

**Why batch?** Voyage AI accepts multiple texts in a single call. It's more efficient and respects rate limits. Example: embed your query and corpus texts together in one call when possible.

**Why `input_type`?** Voyage trains with (document, query) pairs where the query embedding is "pointing toward" the document embedding. If you use `"document"` for both, search quality degrades. It's asymmetric by design — same pattern in Cohere and BGE.
