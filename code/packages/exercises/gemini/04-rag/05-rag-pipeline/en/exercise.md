# Exercise 05 — End-to-end RAG: retrieve then generate

## Concept

You've built every piece separately: embed (01), compare (02), search (03), chunk (04). Now wire them into a complete **Retrieval-Augmented Generation** pipeline:

```
user query
    ↓
embed query
    ↓
score corpus chunks
    ↓
pick top-K
    ↓
stuff chunks into a prompt with the question
    ↓
generate answer (grounded in the retrieved context)
```

Two design decisions matter a lot at step 5:

1. **Instruction**: tell the model to use ONLY the sources, and to say "not in the sources" when the answer isn't there. Without this, the model answers from its training data — defeating the whole point.
2. **Labels**: prefix each chunk with `[Source 1]`, `[Source 2]`, etc. The model reliably reuses those labels in its answer, giving you free citations.

Prompt template you'll use:

```
Answer the question using ONLY the sources below. If the answer isn't in the sources, say "not in the sources".

[Source 1] <chunk text>
[Source 2] <chunk text>

Question: <user query>
```

## Docs & references

1. [RAG pattern overview](https://ai.google.dev/gemini-api/docs/embeddings#retrieval-augmented-generation) — the canonical embed+retrieve+generate sequence
2. [Prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) — how to structure grounded prompts
3. [Embeddings guide](https://ai.google.dev/gemini-api/docs/embeddings) — recap from exercises 01-04

## Your task

1. Chunk + embed the `ARTICLE` (paragraph-level, `RETRIEVAL_DOCUMENT` taskType).
2. Embed the query `"What disease is linked to broken mitochondria?"` with `RETRIEVAL_QUERY`.
3. Score every chunk against the query, take **top 2**.
4. Build the stuffed prompt described above.
5. Call `ai.models.generateContent({ model: "gemini-2.5-flash-lite", contents: prompt, config: { maxOutputTokens: 200 } })`.
6. Return:
   ```ts
   {
     usedChunkIds: [ids of the 2 retrieved chunks],
     answer: response.text,
   }
   ```

## How to verify

```bash
aidev verify 05-rag-pipeline
```

Tests check:
- At least 2 `embedContent` calls (corpus + query) AND exactly 1 `generateContent` call
- Return has `usedChunkIds: number[]` + `answer: string`
- Retrieved chunk IDs are integers in `[0, 3]` (valid paragraph indexes)
- **Retrieval included the disease paragraph (index 3)** — the correct one
- The `generateContent` prompt contains the disease-chunk text (mentions Parkinson's / Alzheimer's)
- Final answer either mentions the disease names (grounded correctly) or says "not in the sources" (honored the guard)

## Extra concept (optional)

This is the minimum RAG pipeline. Everything production adds to it falls into 3 categories:

1. **Retrieval quality**: hybrid search (vectors + keyword), rerankers, query rewriting, HyDE (generate hypothetical doc + embed).
2. **Context management**: chunk dedupe, metadata filters (by date, by tenant), source diversity (don't pick 3 nearly-identical chunks).
3. **Answer quality**: structured citations (`[Source 1]`-style labels in the answer), refusal tuning, fact-check loops.

The danger zone in RAG is hallucinated citations — the model says "[Source 2] states X" but Source 2 says nothing of the kind. Defensive patterns: post-process the answer and assert every `[Source N]` reference substring actually appears in the corresponding chunk. If not, flag or regenerate.

One more thing: the whole pipeline above is stateless. In a real chat agent you also need to carry PREVIOUS turns' context forward so follow-ups ("what about symptoms?") know which topic "what" refers to. Agents (track 05) handle this.
