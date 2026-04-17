# Exercise 01 — Your first embedding

## Concept

RAG (Retrieval-Augmented Generation) starts with **embeddings**: a function that turns text into a vector of floats. Two texts whose vectors point in similar directions are semantically similar; two whose vectors point different ways aren't. You store a corpus as vectors, embed the user's query the same way, and retrieve the closest vectors to find relevant context.

Gemini's embedding model is `gemini-embedding-001`. By default it returns **3072-dimensional** vectors (a "Matryoshka" embedding — you can optionally truncate to 1536 or 768 with `config.outputDimensionality`). The output is **normalized** (L2 norm ≈ 1), which means cosine similarity is just a dot product — convenient.

The shape of the response is:

```ts
{
  embeddings: [
    { values: number[] },  // one entry per input "contents"
  ]
}
```

This exercise is the \"hello world\" — you embed one sentence and inspect the vector. Later exercises compute similarities, build search indexes, and plug the retrieval into `generateContent`.

## Docs & references

1. [Embeddings guide](https://ai.google.dev/gemini-api/docs/embeddings) — models, dimensions, taskType options
2. [`embedContent` reference](https://ai.google.dev/api/embeddings) — request/response schema
3. [`gemini-embedding-001` model card](https://ai.google.dev/gemini-api/docs/models#gemini-embedding-001) — capabilities

## Your task

1. Call `ai.models.embedContent({ ... })` with:
   - `model`: `"gemini-embedding-001"`
   - `contents`: a single sentence (e.g., `"The Amazon rainforest produces about 20% of the world's oxygen."`)
2. Grab `response.embeddings[0].values` — an array of floats.
3. Return:
   - `dimensions`: the length of the vector
   - `firstFive`: the first 5 values (just to eyeball that it looks like real data)
   - `l2Norm`: the L2 norm, `sqrt(sum(v*v))` — should be close to 1

## How to verify

```bash
aidev verify 01-first-embedding
```

Tests check:
- Exactly 1 `embedContent` call
- Uses a `gemini-embedding` model
- `dimensions === 3072` (default dim)
- `firstFive` has 5 finite numbers
- `l2Norm` is between 0.95 and 1.05 (roughly unit-length)

## Extra concept (optional)

Why unit-length? If you normalize vectors so `||v|| == 1`, then **cosine similarity** (`a · b / (|a| * |b|)`) simplifies to just the dot product (`a · b`). You compute it with a single multiply-add loop instead of three. At scale, this matters — vector databases love pre-normalized inputs.

You can reduce dim via `config.outputDimensionality: 1536` (or `768`). Smaller dims = less storage + faster search, at a small quality cost. 768 is a great default for most production RAG systems.

For language-aware search, use `config.taskType: "RETRIEVAL_DOCUMENT"` when storing corpus and `"RETRIEVAL_QUERY"` when embedding a search query. Gemini routes slightly differently for each — small but measurable quality gains in real-world benchmarks.
