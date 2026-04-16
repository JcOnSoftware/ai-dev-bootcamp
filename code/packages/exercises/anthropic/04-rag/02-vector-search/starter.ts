// Docs:
//   Voyage AI embeddings:  https://docs.voyageai.com/reference/embeddings
//   Voyage models:         https://docs.voyageai.com/docs/embeddings

import type { Chunk } from "../fixtures/docs-chunks.ts";
import { DOCS_CHUNKS } from "../fixtures/docs-chunks.ts";

/**
 * A chunk extended with its embedding vector.
 */
export interface IndexedChunk extends Chunk {
  embedding: number[];
}

/**
 * Builds a searchable index by embedding all chunks.
 * Use input_type "document" for corpus texts.
 *
 * @param chunks Array of text chunks to index
 * @returns      Array of chunks with their embedding vectors attached
 */
export async function buildIndex(chunks: Chunk[]): Promise<IndexedChunk[]> {
  throw new Error("TODO: implementá buildIndex() — embebé todos los chunks con input_type 'document'.");
}

/**
 * Searches the index for chunks most similar to the query.
 * Use input_type "query" for the search query.
 * Returns topK results sorted by descending cosine similarity score.
 *
 * @param index  The indexed chunks (from buildIndex)
 * @param query  The search query string
 * @param topK   Number of top results to return
 * @returns      Array of { chunk, score } sorted by score descending
 */
export async function search(
  index: IndexedChunk[],
  query: string,
  topK: number,
): Promise<{ chunk: IndexedChunk; score: number }[]> {
  throw new Error("TODO: implementá search() — embebé la query con input_type 'query' y calculá similitud coseno contra el índice.");
}

/**
 * Demonstrates vector search:
 * 1. Builds an index from DOCS_CHUNKS
 * 2. Searches for "What is prompt caching TTL?"
 * 3. Returns the top 3 results
 */
export default async function run(): Promise<{ chunk: IndexedChunk; score: number }[]> {
  throw new Error("TODO: implementá run() — construí el índice y buscá con search().");
}
