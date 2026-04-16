# 03 — Chunking Strategies

## Concept

Before embedding a long document, you need to split it into **chunks** — manageable fragments. Chunk size directly affects retrieval quality:

- **Chunks too large** → the vector mixes multiple concepts, cosine similarity is less precise.
- **Chunks too small** → you lose context, the LLM doesn't have enough information.

This exercise teaches three strategies:

| Strategy | How it splits | When to use |
|---|---|---|
| **Fixed-size** | Sliding window of N chars with overlap | Unstructured text |
| **Sentence** | By punctuation (`. ! ?`) | Prose, articles, documentation |
| **Paragraph** | By double newline (`\n\n`) | Technical docs, wikis |

**Overlap** between chunks solves the boundary problem: if an idea is split between two chunks, overlap ensures both chunks have enough context.

**Cost: $0.000** — this exercise is pure computation, no API calls.

## Docs & references

- Long context tips: <https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips>
- Rule of thumb: 200-500 tokens per chunk, 10-20% overlap

## Your task

Implement two things in `starter.ts`:

1. **`chunk(text, { size, overlap })`** — fixed-size sliding window:
   - `step = size - overlap`
   - Start at position 0, advance `step` chars per window
   - Last chunk includes all remaining text (may be shorter than `size`)
   - If the text is empty, return `[]`

2. **`run()`** — demonstrate all 3 strategies on the first chunk from `DOCS_CHUNKS`:
   - `fixed`: `chunk(text, { size: 200, overlap: 50 })`
   - `sentence`: split on sentence-ending punctuation (`. ! ?`)
   - `paragraph`: split on double newline (`\n\n`)
   - Return `{ fixed, sentence, paragraph }`

## How to verify

```bash
aidev verify 03-chunking-strategies
aidev verify 03-chunking-strategies --solution
```

## What the tests validate

**Unit tests (no API):**
- `chunk("", ...)` returns `[]`
- Text shorter than `size` returns an array of length 1
- Text exactly equal to `size` returns 1 chunk
- Larger text splits into multiple chunks
- With overlap: last N chars of `chunk[i]` equal first N chars of `chunk[i+1]`
- `run()` returns `{ fixed: string[], sentence: string[], paragraph: string[] }` with non-empty arrays

## Extra concept

**Why overlap?** If a document talks about "the benefits of caching" and the chunk boundary falls right in the middle of a sentence, you lose the idea. Overlap ensures ideas that cross a boundary are complete in at least one chunk.

**In production**: For semantically structured text (technical docs), paragraph chunking typically outperforms fixed-size. For free-form text (transcripts, emails), fixed-size with moderate overlap is more robust.
