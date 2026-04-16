# 02 — Vector Search

## Concept

Once you have embeddings, you can build a **vector index** and perform semantic search. The flow is:

1. **Index**: embed all corpus texts with `input_type: "document"` → store vectors alongside the chunks.
2. **Search**: embed the query with `input_type: "query"` → compute cosine similarity against each index vector → return the top-K most similar.

This exercise implements an **O(n) linear scan** in memory — pedagogically simple. In production you'd use pgvector, Pinecone, or Chroma for Approximate Nearest Neighbor (ANN) search at scale.

**`input_type` asymmetry**: the query vector "points toward" document vectors. Using `"document"` for the query degrades retrieval quality.

## Docs & references

- Voyage AI Embeddings API: <https://docs.voyageai.com/reference/embeddings>
- Voyage AI Models: <https://docs.voyageai.com/docs/embeddings>
- Estimated cost: ~$0.000 (voyage-3.5-lite, free tier)

## Your task

Implement three things in `starter.ts`:

1. **`buildIndex(chunks)`** — call Voyage AI with all corpus texts using `"document"` as `input_type`. Return chunks with their embeddings attached (`IndexedChunk[]`).

2. **`search(index, query, topK)`** — embed the query with `"query"`, compute cosine similarity against each index chunk, return topK results sorted by score descending.

3. **`run()`** — build the index from `DOCS_CHUNKS`, search for `"What is prompt caching TTL?"`, return top-3.

## How to verify

```bash
aidev verify 02-vector-search
aidev verify 02-vector-search --solution
```

## What the tests validate

**Integration tests (real API):**
- `buildIndex(DOCS_CHUNKS)` returns 15 entries, each with an `embedding` of length 1024
- Each `IndexedChunk` preserves original fields (`id`, `text`, `metadata`)
- `search(index, query, 3)` returns 3 results sorted by score descending
- Top result topics for "how does prompt caching work?" match `/cache|cache-control|ttl|caching/i`
- `run()` returns 3 results

## Extra concept

**Why O(n) and not ANN?** With 15 chunks, a linear scan takes microseconds. In production with millions of vectors, you'd use Approximate Nearest Neighbor algorithms (HNSW, IVF) — 1000x faster at the cost of a small recall error. For learning RAG, the scan is enough and shows you the exact mechanics.

**Batch the corpus**: send all chunks in a single Voyage AI call. More efficient than N separate calls and friendlier to rate limits.
