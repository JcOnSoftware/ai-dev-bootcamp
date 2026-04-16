/**
 * Shared fixture for the 05-agents exercise track.
 *
 * Provides two tools (search_docs, read_chunk) backed by DOCS_CHUNKS from the
 * 04-rag track. The agent loop in each exercise imports AGENT_TOOLS and the
 * executeTool dispatcher from here — all without any network calls or vector
 * embeddings (keyword substring match only).
 *
 * This file is NOT an exercise — it has no meta.json, tests.test.ts, or
 * exercise.md. It follows the track-level fixture convention.
 *
 * Source docs:
 *   https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
 *   https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use
 */

import type Anthropic from "@anthropic-ai/sdk";
import { DOCS_CHUNKS } from "../../04-rag/fixtures/docs-chunks.ts";

type ToolDefinition = Anthropic.Tool;

// ── Tool definitions ──────────────────────────────────────────────────────────

export const SEARCH_DOCS_TOOL: ToolDefinition = {
  name: "search_docs",
  description:
    "Search documentation chunks by keyword. Returns a list of matching chunks with their IDs, topics, and sources — but NOT full text. Call read_chunk to retrieve the full content of a specific chunk.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "Keywords to search for (case-insensitive substring match)",
      },
      top_k: {
        type: "number",
        description: "Maximum number of results to return (default: 3)",
      },
    },
    required: ["query"],
  },
};

export const READ_CHUNK_TOOL: ToolDefinition = {
  name: "read_chunk",
  description:
    "Retrieve the full text content of a documentation chunk by its ID. Use the IDs returned by search_docs.",
  input_schema: {
    type: "object" as const,
    properties: {
      id: {
        type: "string",
        description: "The chunk ID to retrieve (e.g. 'caching-01', 'tooluse-03')",
      },
    },
    required: ["id"],
  },
};

export const AGENT_TOOLS = [SEARCH_DOCS_TOOL, READ_CHUNK_TOOL] as const;

// ── Tool executors ─────────────────────────────────────────────────────────────

export function executeSearchDocs(input: { query: string; top_k?: number }): string {
  const topK = input.top_k ?? 3;
  const q = input.query.toLowerCase();
  const matches = DOCS_CHUNKS
    .filter(
      (c) =>
        c.text.toLowerCase().includes(q) ||
        c.metadata.topic.toLowerCase().includes(q),
    )
    .slice(0, topK)
    .map((c) => ({ id: c.id, topic: c.metadata.topic, source: c.metadata.source }));
  return JSON.stringify(matches);
}

export function executeReadChunk(input: { id: string }): string {
  const chunk = DOCS_CHUNKS.find((c) => c.id === input.id);
  if (!chunk) return JSON.stringify({ error: `Chunk not found: ${input.id}` });
  return JSON.stringify({ id: chunk.id, content: chunk.text, metadata: chunk.metadata });
}

export function executeTool(name: string, input: unknown): string {
  if (name === "search_docs")
    return executeSearchDocs(input as { query: string; top_k?: number });
  if (name === "read_chunk")
    return executeReadChunk(input as { id: string });
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}
