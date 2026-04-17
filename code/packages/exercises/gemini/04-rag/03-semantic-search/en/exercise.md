# Exercise 03 — Top-K semantic search over a corpus

## Concept

You have cosine similarity (exercise 02). You have embeddings (exercise 01). Now chain them: given a **corpus** (many docs) and a **query**, return the K docs most similar to the query. That's the retrieval half of RAG.

The pipeline, at minimum:

1. Embed every doc in the corpus. Store `(id, text, vector)` tuples.
2. Embed the query.
3. Compute cosine similarity between query and every doc.
4. Sort descending by score. Slice top-K.

Production systems cache step 1 (embeddings don't change unless the corpus does) and use an approximate-nearest-neighbor (ANN) index for step 3 when the corpus is large. For small corpora (<10k docs) a linear scan is fast enough.

Gemini's embedding API also lets you hint at the **task type**. Docs and queries are asymmetric:
- `taskType: "RETRIEVAL_DOCUMENT"` → store-side, optimized for being retrieved
- `taskType: "RETRIEVAL_QUERY"` → query-side, optimized for retrieving from a store

Use them when doing retrieval-specific search. It's a small quality lift — essentially free to opt into.

## Docs & references

1. [Embeddings guide — task types](https://ai.google.dev/gemini-api/docs/embeddings#task-types) — why document vs query matters
2. [`embedContent` reference](https://ai.google.dev/api/embeddings) — batch embedding (pass `contents` as an array)
3. [RAG pattern overview](https://ai.google.dev/gemini-api/docs/embeddings#retrieval-augmented-generation) — embed-retrieve-generate recap

## Your task

1. Embed the `CORPUS` array in `starter.ts` with ONE batched call. Use `config.taskType: "RETRIEVAL_DOCUMENT"`.
2. Embed the query string (`"How do cells produce energy?"`) with `config.taskType: "RETRIEVAL_QUERY"`.
3. For every doc, compute cosine similarity between the query vector and the doc vector.
4. Sort descending by score, slice the top 3.
5. Return an array of `{ index, text, score }` entries.

## How to verify

```bash
aidev verify 03-semantic-search
```

Tests check:
- At least 2 `embedContent` calls (corpus + query)
- At least one call uses a `RETRIEVAL_*` `taskType`
- Return has at least 1 hit with shape `{ index: number, text: string, score: number }`
- Results are sorted descending by score
- **The top hit for `"How do cells produce energy?"` is the mitochondrion sentence** (index 0) — the most obvious bio answer

## Extra concept (optional)

In production you almost always want to embed the corpus ONCE at index time and persist the vectors alongside the document IDs. Re-embedding on every query is wasteful and slow.

A common implementation: `(id, text, embedding)` rows in a vector DB (Pinecone, Weaviate, Qdrant, pgvector). Search APIs there accept the query vector and return top-K IDs. Your code then fetches the texts by ID.

For the model-card-curious: `gemini-embedding-001` was specifically benchmarked on retrieval tasks, and the official MTEB scores put it in the top tier. The "gemini-embedding" naming is new — this is NOT the same as `text-embedding-004` (the older, smaller Google model). Pin the newer one in your code.
