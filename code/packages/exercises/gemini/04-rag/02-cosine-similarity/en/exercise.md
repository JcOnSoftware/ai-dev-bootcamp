# Exercise 02 — Cosine similarity between two embeddings

## Concept

One embedding vector on its own is useless — you can't tell if it's "right" without comparing it to something. The standard way to compare two embeddings is **cosine similarity**:

```
cos(a, b) = (a · b) / (||a|| * ||b||)
```

It measures the angle between vectors, bounded in `[-1, +1]`:
- `+1` = identical direction (semantically identical)
- `0` = orthogonal (unrelated)
- `-1` = opposite direction (rare in practice)

Because Gemini embeddings are **pre-normalized** (L2 norm ≈ 1, from exercise 01), the formula simplifies to the dot product:

```ts
cosineSimilarity(a, b) = sum(a[i] * b[i] for i in 0..n)
```

One multiply per dimension. Cheap.

You'll verify the core intuition of embeddings: a dog-related sentence and a cat-related sentence score HIGH (both are about pets), while a dog-related sentence and a PHP-related sentence score LOWER (completely different domains).

## Docs & references

1. [Embeddings guide](https://ai.google.dev/gemini-api/docs/embeddings) — recap from exercise 01
2. [`embedContent` reference](https://ai.google.dev/api/embeddings) — array `contents` returns an ordered array of embeddings
3. [Cosine similarity on Wikipedia](https://en.wikipedia.org/wiki/Cosine_similarity) — the math

## Your task

1. Implement `cosineSimilarity(a, b)` using the pre-normalized shortcut (just the dot product).
2. Embed the three sentences in `starter.ts` with ONE call — pass `contents` as an array. The response's `embeddings` array preserves order.
3. Compute:
   - `relatedScore = cosineSimilarity(A, B)` — dogs vs cats (both pets)
   - `unrelatedScore = cosineSimilarity(A, C)` — dogs vs PHP
4. Return `{ relatedScore, unrelatedScore }`.

## How to verify

```bash
aidev verify 02-cosine-similarity
```

Tests check:
- At least one `embedContent` call happened
- Both scores are finite numbers
- Both scores are in `[-1, +1]`
- **`relatedScore > unrelatedScore`** — this is the core RAG intuition
- Delta is at least `0.05` (meaningfully separated, not just noise)

## Extra concept (optional)

The absolute VALUES of cosine similarity are model-specific — `gemini-embedding-001` tends to cluster scores in `[0.3, 0.9]`, while some older embeddings cluster in `[0.6, 0.95]`. What matters is the **ordering**: among your candidates, which one scores highest vs the query?

This is why RAG systems use cosine similarity to RANK — not to decide a yes/no threshold. In practice you retrieve the top-K most similar documents and pass them to the LLM, trusting the model to handle the final relevance judgment.

For scoring large corpora (millions of docs), you don't compute all pairwise similarities — you use an approximate nearest-neighbor (ANN) index like FAISS or a managed vector DB (Pinecone, Weaviate, Vertex AI Vector Search). Same similarity math underneath, with a smarter data structure.
