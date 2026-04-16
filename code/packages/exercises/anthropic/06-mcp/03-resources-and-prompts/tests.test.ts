import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveExerciseFile } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-resources-and-prompts", () => {
  let client: Client;

  beforeAll(async () => {
    const mod = (await import(EXERCISE_FILE)) as {
      buildDocsResourceServer: () => McpServer;
    };

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = mod.buildDocsResourceServer();
    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
  });

  test("resource list includes docs://index", async () => {
    const result = await client.listResources();
    const uris = result.resources.map((r) => r.uri);
    expect(uris).toContain("docs://index");
  });

  test("prompt list includes summarize_docs", async () => {
    const result = await client.listPrompts();
    const names = result.prompts.map((p) => p.name);
    expect(names).toContain("summarize_docs");
  });

  test("getPrompt with topic returns message containing the topic", async () => {
    const result = await client.getPrompt({
      name: "summarize_docs",
      arguments: { topic: "caching" },
    });
    expect(result.messages).toHaveLength(1);
    const msg = result.messages[0];
    const content = msg?.content;
    const text =
      typeof content === "string"
        ? content
        : typeof content === "object" && content !== null && "text" in content
          ? String((content as { text: unknown }).text)
          : JSON.stringify(content);
    expect(text.toLowerCase()).toContain("caching");
  });
});
