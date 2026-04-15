# 04 — Retrieval Pipeline

## Concept

The RAG (Retrieval-Augmented Generation) pipeline combines vector search with language generation:

```
query → embed(query, "query") → search(index, topK)
                                        ↓
                              relevant chunks
                                        ↓
                         system prompt with context
                                        ↓
                    Anthropic.messages.create (Haiku)
                                        ↓
                    answer grounded in your docs
```

The key concept: **the LLM knows nothing about your knowledge base** until you inject it into the system prompt. Retrieval is the bridge between your corpus and generation.

**Note on the harness**: the aidev harness only captures Anthropic API calls. Voyage AI calls (`fetch`) are invisible to it — that's why the tests in this exercise only verify the Claude call, not the embedding calls.

## Docs & references

- Voyage AI Embeddings API: <https://docs.voyageai.com/reference/embeddings>
- Anthropic Messages API: <https://docs.claude.com/en/api/messages>
- Model IDs: <https://docs.claude.com/en/docs/about-claude/models/overview>
- Estimated cost: ~$0.001 per run (Haiku + Voyage free tier)

## Your task

Implement two things in `starter.ts`:

1. **`retrieveAndGenerate(query, index, topK)`**:
   - Embed the query with Voyage AI (input_type `"query"`)
   - Find the `topK` most similar chunks in the index
   - Build a system prompt with the retrieved chunk texts
   - Call `claude-haiku-4-5-20251001` with the system prompt and the query
   - Return `{ answer, retrieved, usage: { embedTokens } }`

2. **`run()`**:
   - Build the index from `DOCS_CHUNKS` (embed all with `"document"`)
   - Call `retrieveAndGenerate("What is the TTL for prompt caching?", index, 3)`
   - Return the result

## How to verify

```bash
aidev verify 04-retrieval-pipeline
aidev verify 04-retrieval-pipeline --solution
```

## What the tests validate

**Integration tests (real API):**
- `run()` makes exactly 1 Anthropic API call (harness captures it)
- The model used is Haiku (`/haiku/i`)
- The system prompt contains content from retrieved chunks
- `userReturn.retrieved` has exactly 3 chunks
- `userReturn.answer` is a non-empty string
- `userReturn.usage.embedTokens` is a positive number

## Extra concept

**Why inject context in the system prompt?** The LLM doesn't have real-time access to your docs. By injecting the most relevant chunks into the system prompt, you give the model the precise information it needs to answer — without hallucinating details it doesn't know.

**RAG prompt engineering**: explicitly tell the model to answer ONLY using the provided context. This reduces hallucinations. In the next exercise (05), you add citations for traceability.
