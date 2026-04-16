// WARNING: NEVER use console.log in MCP server files — it corrupts the stdio
// JSON-RPC stream. Use console.error for any diagnostic output instead.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  executeSearchDocs,
  executeReadChunk,
} from "../../05-agents/fixtures/research-tools.ts";

/**
 * Shared MCP research server fixture for the 06-mcp exercise track.
 *
 * Wraps the two Anthropic-docs tools from 05-agents/fixtures/research-tools.ts
 * as proper MCP tools. Used by exercises 02-05.
 *
 * Returns a fresh McpServer instance on every call — connect to a transport
 * before use.
 */
export function createResearchServer(): McpServer {
  const server = new McpServer({
    name: "research-server",
    version: "1.0.0",
  });

  server.registerTool(
    "search_docs",
    {
      title: "Search docs",
      description:
        "Search the Anthropic docs corpus for chunks matching a keyword query. Returns top-K chunk ids + topic metadata.",
      inputSchema: {
        query: z.string(),
        top_k: z.number().optional(),
      },
    },
    async ({ query, top_k }) => ({
      content: [
        { type: "text", text: executeSearchDocs({ query, top_k }) },
      ],
    }),
  );

  server.registerTool(
    "read_chunk",
    {
      title: "Read chunk",
      description:
        "Read the full content of a specific docs chunk by id.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => ({
      content: [{ type: "text", text: executeReadChunk({ id }) }],
    }),
  );

  return server;
}
