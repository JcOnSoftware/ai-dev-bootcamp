# 05 — Citations & Grounding

## Concept

**Citations** are the mechanism for making your RAG traceable: the LLM doesn't just answer, it tells you which sources it used. This enables:

1. **Verifiability**: users can see where each claim comes from.
2. **Hallucination detection**: if the LLM cites an ID that doesn't exist, you know it made something up.
3. **Source UI**: you can display links to the original documentation alongside the answer.

The technique: ask the LLM to respond in structured JSON with `answer` and `citations`. You use **prompt engineering** (without tool use) because it's simpler and sufficient for this case.

**Tolerant parser**: LLMs sometimes wrap JSON in markdown fences (` ```json ... ``` `) even when told not to. The tolerant parser cleans those up before `JSON.parse`. The error includes the raw LLM text for debugging.

## Docs & references

- XML tags in prompts: <https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags>
- Voyage AI Embeddings API: <https://docs.voyageai.com/reference/embeddings>
- Anthropic Messages API: <https://docs.claude.com/en/api/messages>
- Estimated cost: ~$0.001 per run (Haiku + Voyage free tier)

## Your task

Implement three things in `starter.ts`:

1. **`parseJsonResponse<T>(text)`** — tolerant parser:
   - If the text starts with ` ```json ` or ` ``` `, strip the fences
   - Call `JSON.parse` on the clean text
   - If it fails, throw an error that includes the raw text in the message

2. **`generateWithCitations(query)`** — RAG pipeline with citations:
   - Build the index from `DOCS_CHUNKS`
   - Retrieve the top-3 chunks
   - Build a system prompt that instructs Claude to respond in JSON: `{"answer":"...","citations":["chunk-id"]}`
   - Call `claude-haiku-4-5-20251001`
   - Parse the response with `parseJsonResponse`
   - Validate that cited IDs exist in the retrieved chunks
   - Return `{ answer, citations, retrieved }`

3. **`run()`** — call `generateWithCitations("What formats does Claude support for tool use input?")`

## How to verify

```bash
aidev verify 05-citations-grounding
aidev verify 05-citations-grounding --solution
```

## What the tests validate

**Unit tests (no API):**
- `parseJsonResponse('{"answer":"x","citations":[]}')` → correct object
- `parseJsonResponse('```json\n{...}\n```')` → strips fences and parses
- `parseJsonResponse('```\n{...}\n```')` → strips fences without language tag

**Integration tests (real API):**
- Exactly 1 Anthropic API call
- Haiku model
- System prompt contains JSON instruction or "citation"
- `userReturn.citations` is an array
- Each citation ID exists in `userReturn.retrieved`
- `userReturn.answer` is a non-empty string

## Extra concept

**Why validate IDs?** If the LLM invents an ID that doesn't exist in the retrieved chunks, it's a hallucination signal. Validation protects users from false citations. In production you'd log these cases as RAG reliability metrics.

**Alternative with structured outputs**: Instead of prompt engineering for JSON, you could use `response_format: { type: "json_object" }` or tool use with a defined schema. The tradeoff: more robust but more code. For simple RAG, prompt engineering is sufficient.
