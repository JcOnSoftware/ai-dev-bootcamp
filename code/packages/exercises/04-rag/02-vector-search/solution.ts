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
 * Voyage AI HTTP client.
 * Inlined per exercise to teach the HTTP contract directly.
 */
async function voyageEmbed(
  inputs: string[],
  inputType: "document" | "query",
): Promise<{ embeddings: number[][]; totalTokens: number }> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: inputs, model: "voyage-3.5-lite", input_type: inputType }),
  });
  if (!res.ok) throw new Error(`Voyage API error: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
    usage: { total_tokens: number };
  };
  return {
    embeddings: data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding),
    totalTokens: data.usage.total_tokens,
  };
}

/**
 * Cosine similarity for L2-normalized vectors = dot product.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
  }
  return dot;
}

/**
 * Builds a searchable in-memory index by embedding all chunks with Voyage AI.
 * Uses input_type "document" — corpus texts.
 *
 * Note: This is an O(n) scan. Pedagogically simple; for production use
 * pgvector, Pinecone, or Chroma for ANN search at scale.
 */
export async function buildIndex(chunks: Chunk[]): Promise<IndexedChunk[]> {
  const { embeddings } = await voyageEmbed(
    chunks.map((c) => c.text),
    "document",
  );
  return chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i]!,
  }));
}

/**
 * Searches the index for the most semantically similar chunks to the query.
 * Uses input_type "query" — asymmetric from "document" for better retrieval quality.
 */
export async function search(
  index: IndexedChunk[],
  query: string,
  topK: number,
): Promise<{ chunk: IndexedChunk; score: number }[]> {
  const { embeddings } = await voyageEmbed([query], "query");
  const queryVec = embeddings[0]!;

  return index
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryVec, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Demonstrates vector search end-to-end:
 * 1. Builds index from the shared DOCS_CHUNKS corpus
 * 2. Searches for "What is prompt caching TTL?"
 * 3. Returns the top 3 results
 */
export default async function run(): Promise<{ chunk: IndexedChunk; score: number }[]> {
  const index = await buildIndex(DOCS_CHUNKS);
  const results = await search(index, "What is prompt caching TTL?", 3);

  console.log("\nTop 3 results for 'What is prompt caching TTL?':");
  for (const { chunk, score } of results) {
    console.log(`  [${score.toFixed(4)}] ${chunk.id} — ${chunk.metadata.topic}`);
  }

  return results;
}
