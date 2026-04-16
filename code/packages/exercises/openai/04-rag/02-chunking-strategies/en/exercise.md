# Exercise 02 — Chunking Strategies

## Concept

Before you can embed large documents, you need to split them into smaller fragments — this is called **chunking**. The reason is simple: embedding models have an input token limit, and smaller chunks also produce more precise search results because they contain less noise.

The most basic strategy is **fixed-size chunking**: you split the text every N characters. But if you cut right in the middle of a sentence, you lose context. The solution is to add an **overlap**: the next chunk starts a little before the end of the previous chunk. This way, each chunk shares some characters with the previous and the next one.

For example with `chunkSize=200` and `overlap=50`:
- Chunk 1: characters 0–199
- Chunk 2: characters 150–349 (steps back 50 from the edge)
- Chunk 3: characters 300–499

This exercise is **pure algorithm** — no API call. Understanding this step is essential before moving on to embedding and search.

## Docs & references

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — context on why we chunk before embedding
2. [Node.js SDK](https://github.com/openai/openai-node) — SDK reference (useful for the following exercises)
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — generation endpoint reference (next track)

## Your task

1. Open `starter.ts`. The sample text `SAMPLE_TEXT` is already defined — do not modify it.
2. Implement the function `chunkText(text, chunkSize, overlap)` that:
   - Splits `text` into chunks of at most `chunkSize` characters
   - Each consecutive chunk starts `chunkSize - overlap` characters after the previous one
   - Does not produce empty chunks
3. Call `chunkText(SAMPLE_TEXT, 200, 50)`.
4. Return `{ chunks, chunkCount }` where `chunkCount === chunks.length`.

## How to verify

```bash
aidev verify 02-chunking-strategies
```

Tests check:
- No API call is made
- `chunks` is an array with more than 1 item
- Each chunk has at most 250 characters
- No empty chunks
- `chunkCount` equals `chunks.length`

## Extra concept (optional)

Character-based chunking is simple but imprecise. In production, it's better to chunk by **tokens** (because API limits are in tokens, not characters). There are also more sophisticated strategies like **recursive character splitting** (split by `\n\n`, then `\n`, then ` `) or **semantic chunking** (uses embeddings to detect topic changes). For this bootcamp, character chunking is enough to understand the concept.
