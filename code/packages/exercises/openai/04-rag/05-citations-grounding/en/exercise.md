# Exercise 05 — Citations and Grounding

## Concept

**Grounding** is the practice of anchoring model responses to verifiable sources. A RAG system without citations gives you answers that might be correct, but you don't know which part of the corpus they came from. With citations, you can verify each claim and show the user the original source.

The technique is simple: in the system prompt you instruct the model to use a specific citation format, like `[Source N]`. Then you process the response with a regex to extract all references. The result is an answer that mixes generated text with references you can map back to the original chunks.

This pattern is essential in enterprise RAG applications where traceability matters: if the model says something, it must be able to justify it with a source from the corpus.

## Docs & references

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — embeddings for the retrieval step
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — generation endpoint with system prompt
3. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration

## Your task

1. Open `starter.ts`. The `CORPUS` and `QUERY` are already defined — do not modify them.
2. Implement the full RAG pipeline (chunk → embed → retrieve top 2 → generate).
3. In the system prompt, instruct the model:
   `"Answer using only the provided context. Always cite your sources using [Source N] format where N is the source number."`
4. Format the context as:
   `[Source 1] <chunk1>\n\n[Source 2] <chunk2>`
5. Extract citations from the answer text using the regex `/\[Source \d+\]/g`.
6. Return `{ answer, citations }` where `citations` is the array of matched strings.

## How to verify

```bash
aidev verify 05-citations-grounding
```

Tests check:
- At least 1 chat completion call is made
- System message contains citation instructions
- `answer` is a non-empty string
- `citations` is an array
- The answer contains at least one citation marker like `[Source N]`
- `citations` has at least 1 entry
- Each citation matches the `[Source N]` format

## Extra concept (optional)

You can take citations further: instead of just extracting the `[Source N]` marker, you can map each citation to the original chunk and show the user the exact text the information came from. You can also ask the model to use structured output (JSON) to return citations as a typed array instead of extracting them with regex — that's more robust but more complex. For production systems, combining both techniques gives the best results.
