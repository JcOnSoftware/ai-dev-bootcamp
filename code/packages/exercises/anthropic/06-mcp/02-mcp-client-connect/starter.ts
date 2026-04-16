// Docs:
//   MCP quickstart (client): https://modelcontextprotocol.io/quickstart/client
//   MCP architecture:        https://modelcontextprotocol.io/docs/concepts/architecture

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createResearchServer } from "../fixtures/research-server.ts";

/**
 * Connect to the research MCP server via InMemoryTransport.
 *
 * Returns the connected client and a cleanup function that closes the client.
 * The caller MUST call cleanup() when done to avoid transport leaks.
 */
export async function connectResearchClient(): Promise<{
  client: Client;
  cleanup: () => Promise<void>;
}> {
  // TODO: Create InMemoryTransport pair, start the research server,
  //       connect a Client, and return { client, cleanup }.
  throw new Error("TODO: implement connectResearchClient()");
}

/**
 * Demonstration: list tools and run a search query.
 */
export default async function run(): Promise<unknown> {
  // TODO: Call connectResearchClient(), list tools, call search_docs,
  //       cleanup, and return { tools, searchResult }.
  throw new Error("TODO: implement run()");
}
