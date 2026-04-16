# Exercise 03 — Vector Search

## Concept

Vector search is the heart of RAG. The idea is simple: you convert both your documents and the user's query into vectors, then you find which documents are "closest" to the query vector.

The most common distance metric is **cosine similarity**. It measures the angle between two vectors: if the angle is 0° (identical vectors), the similarity is 1. If the angle is 90° (orthogonal vectors, no relation), the similarity is 0. The formula is:

```
cosine_similarity(a, b) = dot_product(a, b) / (magnitude(a) * magnitude(b))
```

The nice thing about OpenAI is that you can embed multiple texts in a single call by passing an array as `input`. That means you can embed all 5 documents and the query in a single request — more efficient and cheaper.

## Docs & references

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — cosine similarity, Euclidean distance, and when to use each
2. [Embeddings API reference](https://platform.openai.com/docs/api-reference/embeddings/create) — full parameters, including batch input
3. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration

## Your task

1. Open `starter.ts`. The `DOCUMENTS` and `QUERY` are already defined — do not modify them.
2. Embed all documents AND the query in a single call to `client.embeddings.create()`.
   - `input`: `[QUERY, ...DOCUMENTS]`
3. Implement `cosineSimilarity(a, b)` that computes cosine similarity between two vectors.
4. Compute the similarity between the query embedding and each document embedding.
5. Sort the results descending by similarity.
6. Return `{ query: QUERY, results }` where each result is `{ text, similarity }`.

## How to verify

```bash
aidev verify 03-vector-search
```

Tests check:
- `query` is a non-empty string
- `results` is an array with at least 1 item
- Each result has `text` (string) and `similarity` (number)
- Similarity values are between 0 and 1
- Results are sorted descending by similarity
- The top result is the document about TypeScript

## Extra concept (optional)

In this exercise, we search across 5 documents with brute force — O(n). In production with millions of vectors, this is too slow. That's where vector databases come in: **Pinecone**, **Weaviate**, **Qdrant**, or **pgvector** (a PostgreSQL extension). These implement Approximate Nearest Neighbor (ANN) algorithms like HNSW that are orders of magnitude faster.
