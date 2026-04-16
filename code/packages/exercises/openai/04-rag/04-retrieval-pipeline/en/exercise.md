# Exercise 04 — Retrieval Pipeline

## Concept

RAG (**Retrieval-Augmented Generation**) is the pattern that combines semantic search with text generation. Instead of asking the model to "remember" data, you pass the relevant context directly in the prompt. The model just needs to read and reason about what you give it — no fine-tuning needed, and the model doesn't need to know the data in advance.

The full pipeline has 4 stages:
1. **Chunk**: split the corpus into manageable fragments
2. **Embed**: convert all chunks into vectors
3. **Retrieve**: for a given query, find the most similar chunks
4. **Generate**: send relevant chunks as context to the chat model

This pattern solves one of the most common problems with LLMs: **hallucination**. By forcing the model to answer only with the provided context, you dramatically reduce made-up responses.

## Docs & references

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — embeddings as the foundation of the retrieval step
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — endpoint used for final generation
3. [Node.js SDK](https://github.com/openai/openai-node) — client setup and configuration

## Your task

1. Open `starter.ts`. The `CORPUS` and `QUERY` are already defined — do not modify them.
2. Split the `CORPUS` into chunks of ~200 characters with 50-char overlap.
3. Embed all chunks and the query in a single call to `client.embeddings.create()`.
4. Compute cosine similarity between the query and each chunk. Pick the **top 2**.
5. Call `client.chat.completions.create()` with:
   - `model`: `"gpt-4.1-nano"`
   - `max_completion_tokens`: 256
   - `messages`: system with `"Answer using only the provided context."` + user with the query and chunks as context
6. Return `{ query: QUERY, context: topChunks, answer }`.

## How to verify

```bash
aidev verify 04-retrieval-pipeline
```

Tests check:
- At least 1 chat completion call is made
- Request includes a `system` message and a `user` message
- `query` is a non-empty string
- `context` is an array with at least 1 chunk
- `answer` is a non-empty string
- The answer mentions "TypeScript" (correct retrieval)

## Extra concept (optional)

The system prompt `"Answer using only the provided context."` is the key to **grounding**: you instruct the model not to use external knowledge. You can reinforce it by adding `"If the answer is not in the context, say 'I don't know'."` to prevent the model from "completing" information that isn't in the context. The next exercise explores how to ask the model to explicitly cite its sources.
