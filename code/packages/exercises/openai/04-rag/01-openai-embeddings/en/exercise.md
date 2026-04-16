# Exercise 01 — OpenAI Embeddings

## Concept

An **embedding** is a numerical representation of text — a vector of floating-point numbers. The idea is that texts with similar meaning end up close together in that vector space. That's what makes semantic search possible: you don't search for exact words, you search for meaning.

OpenAI offers the `text-embedding-3-small` model that converts text into vectors with **1536 dimensions** by default. You can send multiple texts in a single call by passing an array as `input`.

The embeddings endpoint is different from chat completions: it doesn't generate text, it only transforms text into vectors. The result is a `data` array where each item has `embedding` (the vector), `index` (position in the input), and `object`.

This operation is the foundation of any RAG system: first you generate embeddings for your documents, then you generate an embedding for the user's query, and finally you compare similarity to find relevant documents.

## Docs & references

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — what embeddings are, when to use them, and the dimensions of each model
2. [Embeddings API reference](https://platform.openai.com/docs/api-reference/embeddings/create) — full parameters for the `embeddings.create` endpoint
3. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration

## Your task

1. Open `starter.ts` and create an OpenAI client instance.
2. Call `client.embeddings.create()` with:
   - `model`: `"text-embedding-3-small"`
   - `input`: `["Hello world", "Hola mundo"]`
3. Return an object with:
   - `embeddings`: the `response.data` array (each item has `embedding`, `index`, `object`)
   - `dimensions`: the length of the first vector (`response.data[0].embedding.length`)

## How to verify

```bash
aidev verify 01-openai-embeddings
```

Tests check:
- `embeddings` is an array with 2 items
- Each item has an `embedding` property that is an array of numbers
- `dimensions` is `1536` (default dimension for `text-embedding-3-small`)
- `dimensions` matches the actual length of the first vector

## Extra concept (optional)

You can reduce dimensions with the `dimensions` parameter in the call (e.g., `dimensions: 256`). Fewer dimensions = smaller vectors = faster search, but with some loss of semantic precision. The `text-embedding-3-large` model has 3072 dimensions and higher precision, but costs more. For most use cases, `text-embedding-3-small` at 1536 dimensions is the sweet spot between cost and quality.
