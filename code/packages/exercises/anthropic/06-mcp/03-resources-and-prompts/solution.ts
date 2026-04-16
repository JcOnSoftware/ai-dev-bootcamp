// Docs:
//   MCP resources:    https://modelcontextprotocol.io/docs/concepts/resources
//   MCP prompts:      https://modelcontextprotocol.io/docs/concepts/prompts
//   MCP architecture: https://modelcontextprotocol.io/docs/concepts/architecture

// WARNING: NEVER use console.log in MCP server files — it corrupts the stdio
// JSON-RPC stream. Use console.error for any diagnostic output instead.

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

/**
 * Build and return an MCP server that exposes a static resource and a prompt template.
 */
export function buildDocsResourceServer(): McpServer {
  const server = new McpServer({ name: "docs-server", version: "1.0.0" });

  // Static resource: docs://index
  server.registerResource(
    "docs-index",
    "docs://index",
    { mimeType: "text/plain" },
    async (_uri) => ({
      contents: [
        {
          uri: "docs://index",
          mimeType: "text/plain",
          text: "Available chunks: caching-01, caching-02, tooluse-01, tooluse-02",
        },
      ],
    }),
  );

  // Template resource: docs://chunks/{id}
  server.registerResource(
    "docs-chunk",
    new ResourceTemplate("docs://chunks/{id}", { list: undefined }),
    { mimeType: "text/plain" },
    async (uri, variables) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/plain",
          text: `Chunk content for id: ${String(variables["id"] ?? "")}`,
        },
      ],
    }),
  );

  // Prompt template: summarize_docs
  server.registerPrompt(
    "summarize_docs",
    {
      title: "Summarize docs",
      description: "Generate a summary request for a specific documentation topic.",
      argsSchema: { topic: z.string() },
    },
    ({ topic }) => ({
      messages: [
        {
          role: "user",
          content: { type: "text", text: `Summarize the documentation about ${topic}` },
        },
      ],
    }),
  );

  return server;
}

/**
 * Demonstration: connect and exercise all three MCP primitives.
 */
export default async function run(): Promise<unknown> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = buildDocsResourceServer();
  await server.connect(serverTransport);

  const client = new Client({ name: "demo-client", version: "1.0.0" });
  await client.connect(clientTransport);

  const resources = await client.listResources();
  const indexContent = await client.readResource({ uri: "docs://index" });
  const prompts = await client.listPrompts();
  const promptResult = await client.getPrompt({
    name: "summarize_docs",
    arguments: { topic: "caching" },
  });

  await client.close();

  return { resources, indexContent, prompts, promptResult };
}
