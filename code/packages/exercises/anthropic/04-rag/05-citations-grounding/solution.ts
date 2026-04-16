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

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
  }
  return dot;
}

async function buildIndex(chunks: Chunk[]): Promise<IndexedChunk[]> {
  const { embeddings } = await voyageEmbed(
    chunks.map((c) => c.text),
    "document",
  );
  return chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i]! }));
}

/**
 * Tolerant JSON parser.
 * Handles raw JSON and markdown-fenced JSON (```json ... ``` or ``` ... ```).
 * Throws with raw text in error message on parse failure.
 */
export function parseJsonResponse<T>(text: string): T {
  // Strip markdown fences if present
  const stripped = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/, "")
    .trim();
  try {
    return JSON.parse(stripped) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON response. Raw LLM output:\n---\n${text}\n---\nError: ${String(err)}`,
    );
  }
}

/**
 * RAG pipeline with citations.
 * Instructs Claude to respond in structured JSON with answer + cited chunk IDs.
 */
export async function generateWithCitations(query: string): Promise<{
  answer: string;
  citations: string[];
  retrieved: IndexedChunk[];
}> {
  // Step 1: build index and retrieve
  const index = await buildIndex(DOCS_CHUNKS);

  const { embeddings: queryEmbeds } = await voyageEmbed([query], "query");
  const queryVec = queryEmbeds[0]!;

  const retrieved = index
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryVec, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.chunk);

  // Step 2: build system prompt with JSON output instructions
  const context = retrieved
    .map((c) => `<chunk id="${c.id}">\n${c.text}\n</chunk>`)
    .join("\n\n");

  const systemPrompt =
    "You are a technical assistant. Answer the user's question using ONLY the provided context chunks.\n\n" +
    "Context:\n" +
    context +
    "\n\n" +
    "IMPORTANT: Respond with ONLY a JSON object in this exact format (no extra text, no markdown fences):\n" +
    '{"answer":"your answer here","citations":["chunk-id-1","chunk-id-2"]}' +
    "\n\nOnly include chunk IDs that you actually used in your answer.";

  // Step 3: call Claude Haiku (harness captures this call)
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: query }],
  });

  const rawText = response.content.find((b) => b.type === "text")?.text ?? "{}";

  // Step 4: parse response tolerantly
  const parsed = parseJsonResponse<{ answer: string; citations: string[] }>(rawText);

  // Step 5: validate citations — only keep IDs that exist in retrieved
  const retrievedIds = new Set(retrieved.map((c) => c.id));
  const validCitations = (parsed.citations ?? []).filter((id) => retrievedIds.has(id));

  console.log(`\nQuery: ${query}`);
  console.log(`Retrieved: ${retrieved.map((c) => c.id).join(", ")}`);
  console.log(`Citations: ${validCitations.join(", ")}`);
  console.log(`Answer: ${parsed.answer}`);

  return {
    answer: parsed.answer ?? "",
    citations: validCitations,
    retrieved,
  };
}

/**
 * Demonstrates citations and grounding.
 */
export default async function run(): Promise<{
  answer: string;
  citations: string[];
  retrieved: IndexedChunk[];
}> {
  return generateWithCitations("What formats does Claude support for tool use input?");
}
