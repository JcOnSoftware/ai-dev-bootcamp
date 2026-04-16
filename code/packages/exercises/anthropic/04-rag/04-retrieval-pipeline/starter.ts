// Docs:
//   Voyage AI embeddings:  https://docs.voyageai.com/reference/embeddings
//   Anthropic Messages:    https://docs.claude.com/en/api/messages
//   Model IDs:             https://docs.claude.com/en/docs/about-claude/models/overview

import Anthropic from "@anthropic-ai/sdk";
import { DOCS_CHUNKS } from "../fixtures/docs-chunks.ts";
import type { Chunk } from "../fixtures/docs-chunks.ts";

export interface IndexedChunk extends Chunk {
  embedding: number[];
}

/**
 * Full RAG pipeline: retrieves relevant chunks and generates an answer using Claude.
 *
 * Steps:
 * 1. Embed the query with Voyage AI (input_type: "query")
 * 2. Search the index for the topK most similar chunks
 * 3. Build a system prompt containing the retrieved chunk texts
 * 4. Call Claude Haiku (claude-haiku-4-5-20251001) with the constructed prompt
 * 5. Return the answer, retrieved chunks, and embedding token count
 *
 * @param query  The user question to answer
 * @param index  Pre-built vector index (from buildIndex)
 * @param topK   Number of chunks to retrieve
 */
export async function retrieveAndGenerate(
  query: string,
  index: IndexedChunk[],
  topK: number,
): Promise<{
  answer: string;
  retrieved: IndexedChunk[];
  usage: { embedTokens: number };
}> {
  throw new Error("TODO: implementá retrieveAndGenerate() — embebé la query, buscá, y generá con Claude.");
}

/**
 * Demonstrates the full RAG pipeline:
 * 1. Builds the vector index from DOCS_CHUNKS
 * 2. Calls retrieveAndGenerate with "What is the TTL for prompt caching?" and topK=3
 * 3. Returns the result
 */
export default async function run(): Promise<{
  answer: string;
  retrieved: IndexedChunk[];
  usage: { embedTokens: number };
}> {
  throw new Error("TODO: implementá run() — construí el índice y llamá a retrieveAndGenerate.");
}
