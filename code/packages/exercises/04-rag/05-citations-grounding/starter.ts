// Docs:
//   XML tags in prompts:   https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags
//   Voyage AI embeddings:  https://docs.voyageai.com/reference/embeddings
//   Anthropic Messages:    https://docs.claude.com/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import { DOCS_CHUNKS } from "../fixtures/docs-chunks.ts";
import type { Chunk } from "../fixtures/docs-chunks.ts";

export interface IndexedChunk extends Chunk {
  embedding: number[];
}

/**
 * Tolerant JSON parser that handles both raw JSON strings and markdown-fenced JSON.
 *
 * LLMs sometimes wrap JSON in ```json ... ``` fences even when instructed not to.
 * This parser strips the fences before parsing.
 *
 * On failure, throws with the raw text in the error message for debugging.
 *
 * @param text  Raw LLM output text (may or may not have fences)
 * @returns     Parsed object of type T
 */
export function parseJsonResponse<T>(text: string): T {
  throw new Error("TODO: implementá parseJsonResponse() — strips markdown fences then JSON.parse.");
}

/**
 * RAG pipeline with citations:
 * 1. Build index from DOCS_CHUNKS
 * 2. Search for the most relevant chunks (topK=3)
 * 3. Construct a system prompt that asks Claude to respond in JSON format:
 *    { "answer": "...", "citations": ["chunk-id-1", "chunk-id-2"] }
 * 4. Parse the response with parseJsonResponse (tolerant parser)
 * 5. Validate that all cited chunk IDs exist in the retrieved set
 * 6. Return answer, citations, and retrieved chunks
 *
 * @param query  The user question
 */
export async function generateWithCitations(query: string): Promise<{
  answer: string;
  citations: string[];
  retrieved: IndexedChunk[];
}> {
  throw new Error("TODO: implementá generateWithCitations() — RAG pipeline con citas en JSON.");
}

/**
 * Demonstrates citations and grounding:
 * Queries "What formats does Claude support for tool use input?"
 * and returns the answer with source citations.
 */
export default async function run(): Promise<{
  answer: string;
  citations: string[];
  retrieved: IndexedChunk[];
}> {
  throw new Error("TODO: implementá run() llamando a generateWithCitations().");
}
