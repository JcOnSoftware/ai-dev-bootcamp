// Docs:
//   MCP quickstart (server): https://modelcontextprotocol.io/quickstart/server
//   MCP architecture:        https://modelcontextprotocol.io/docs/concepts/architecture

// WARNING: NEVER use console.log in MCP server files — it corrupts the stdio
// JSON-RPC stream. Use console.error for any diagnostic output instead.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

/**
 * Build and return an MCP server that exposes a single "echo" tool.
 */
export function buildEchoServer(): McpServer {
  const server = new McpServer({ name: "echo-server", version: "1.0.0" });

  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Returns the input text unchanged.",
      inputSchema: { text: z.string() },
    },
    async ({ text }) => ({
      content: [{ type: "text", text }],
    }),
  );

  return server;
}

/**
 * Demonstration: connect via InMemoryTransport, call the echo tool, return result.
 */
export default async function run(): Promise<unknown> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const server = buildEchoServer();
  await server.connect(serverTransport);

  const client = new Client({ name: "demo-client", version: "1.0.0" });
  await client.connect(clientTransport);

  const tools = await client.listTools();
  const result = await client.callTool({ name: "echo", arguments: { text: "Hello MCP!" } });

  await client.close();

  return { tools: tools.tools.map((t) => t.name), result };
}
