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

const anthropic = new Anthropic();

/**
 * Voyage AI HTTP client (inlined per exercise).
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
 * Dot product == cosine similarity for L2-normalized vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
  }
  return dot;
}

/**
 * Builds an in-memory vector index from chunks.
 */
async function buildIndex(chunks: Chunk[]): Promise<IndexedChunk[]> {
  const { embeddings } = await voyageEmbed(
    chunks.map((c) => c.text),
    "document",
  );
  return chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i]! }));
}

/**
 * Full RAG pipeline: retrieve + generate.
 *
 * 1. Embed the query with Voyage AI (input_type: "query")
 * 2. Rank all index chunks by cosine similarity
 * 3. Take the top-K chunks and build a system prompt
 * 4. Call Claude Haiku with the enriched system prompt
 * 5. Return answer + retrieved chunks + Voyage token count
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
  // Step 1: embed the query
  const { embeddings: queryEmbeds, totalTokens: embedTokens } = await voyageEmbed(
    [query],
    "query",
  );
  const queryVec = queryEmbeds[0]!;

  // Step 2: rank and retrieve
  const ranked = index
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryVec, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const retrieved = ranked.map((r) => r.chunk);

  // Step 3: build system prompt from retrieved chunks
  const context = retrieved
    .map((c, i) => `[${i + 1}] ${c.metadata.topic} (${c.id})\n${c.text}`)
    .join("\n\n");

  const systemPrompt =
    "You are a technical assistant. Answer the user's question using ONLY the provided context.\n\n" +
    "Context:\n" +
    context;

  // Step 4: call Claude Haiku (harness captures this call)
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: query }],
  });

  const answer =
    response.content.find((b) => b.type === "text")?.text ?? "(no text response)";

  return { answer, retrieved, usage: { embedTokens } };
}

/**
 * Demonstrates the full RAG pipeline end-to-end.
 */
export default async function run(): Promise<{
  answer: string;
  retrieved: IndexedChunk[];
  usage: { embedTokens: number };
}> {
  const index = await buildIndex(DOCS_CHUNKS);
  const result = await retrieveAndGenerate("What is the TTL for prompt caching?", index, 3);

  console.log("\nQuery: What is the TTL for prompt caching?");
  console.log("Retrieved chunks:");
  for (const chunk of result.retrieved) {
    console.log(`  - ${chunk.id} (${chunk.metadata.topic})`);
  }
  console.log(`\nAnswer: ${result.answer}`);
  console.log(`Embed tokens used: ${result.usage.embedTokens}`);

  return result;
}
