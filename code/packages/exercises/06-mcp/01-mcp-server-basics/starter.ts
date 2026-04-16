// Docs:
//   MCP quickstart (server): https://modelcontextprotocol.io/quickstart/server
//   MCP architecture:        https://modelcontextprotocol.io/docs/concepts/architecture

// WARNING: NEVER use console.log in MCP server files — it corrupts the stdio
// JSON-RPC stream. Use console.error for any diagnostic output instead.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Build and return an MCP server that exposes a single "echo" tool.
 *
 * Requirements:
 *  - Server name: "echo-server", version: "1.0.0"
 *  - Tool name: "echo"
 *  - Input schema: { text: z.string() }
 *  - Handler: returns the same text back as a text content block
 */
export function buildEchoServer(): McpServer {
  // TODO: Create a new McpServer, register the "echo" tool, return the server.
  throw new Error("TODO: implement buildEchoServer()");
}

/**
 * Demonstration entry point — connects via InMemoryTransport, calls the echo
 * tool, and returns the result.
 */
export default async function run(): Promise<unknown> {
  // TODO: Implement run() using InMemoryTransport to demo the echo server.
  throw new Error("TODO: implement run()");
}
