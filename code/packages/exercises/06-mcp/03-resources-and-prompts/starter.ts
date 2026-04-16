// Docs:
//   MCP resources:  https://modelcontextprotocol.io/docs/concepts/resources
//   MCP prompts:    https://modelcontextprotocol.io/docs/concepts/prompts
//   MCP architecture: https://modelcontextprotocol.io/docs/concepts/architecture

// WARNING: NEVER use console.log in MCP server files — it corrupts the stdio
// JSON-RPC stream. Use console.error for any diagnostic output instead.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Build and return an MCP server that exposes:
 *  - A static resource at "docs://index"
 *  - A prompt template "summarize_docs" that accepts a "topic" argument
 *
 * Requirements:
 *  - Resource URI: "docs://index"
 *  - Prompt name: "summarize_docs"
 *  - Prompt arg: { topic: z.string() }
 *  - Prompt handler: return a user message containing the topic text
 */
export function buildDocsResourceServer(): McpServer {
  // TODO: Create a new McpServer, register the resource and prompt, return the server.
  throw new Error("TODO: implement buildDocsResourceServer()");
}

/**
 * Demonstration: connect via InMemoryTransport, list resources, list prompts,
 * get the summarize_docs prompt with topic "caching".
 */
export default async function run(): Promise<unknown> {
  // TODO: implement run()
  throw new Error("TODO: implement run()");
}
