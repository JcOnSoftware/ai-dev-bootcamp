// Docs:
//   MCP quickstart (client): https://modelcontextprotocol.io/quickstart/client
//   MCP architecture:        https://modelcontextprotocol.io/docs/concepts/architecture

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createResearchServer } from "../fixtures/research-server.ts";

/**
 * Connect to the research MCP server via InMemoryTransport.
 *
 * Returns the connected client and a cleanup function.
 * In production you'd use StdioClientTransport instead:
 *   new StdioClientTransport({ command: "bun", args: ["run", "solution.ts"] })
 */
export async function connectResearchClient(): Promise<{
  client: Client;
  cleanup: () => Promise<void>;
}> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const server = createResearchServer();
  await server.connect(serverTransport);

  const client = new Client({ name: "research-client", version: "1.0.0" });
  await client.connect(clientTransport);

  return {
    client,
    cleanup: async () => {
      await client.close();
    },
  };
}

/**
 * Demonstration: list tools and run a search query.
 */
export default async function run(): Promise<unknown> {
  const { client, cleanup } = await connectResearchClient();

  const toolsResult = await client.listTools();
  const searchResult = await client.callTool({
    name: "search_docs",
    arguments: { query: "prompt caching" },
  });

  await cleanup();

  return { tools: toolsResult.tools, searchResult };
}
