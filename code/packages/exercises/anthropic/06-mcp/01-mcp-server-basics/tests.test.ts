import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { resolveExerciseFile } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-mcp-server-basics", () => {
  let client: Client;

  beforeAll(async () => {
    // Dynamically import the exercise file to get the buildEchoServer export
    const mod = (await import(EXERCISE_FILE)) as {
      buildEchoServer: () => import("@modelcontextprotocol/sdk/server/mcp.js").McpServer;
    };

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = mod.buildEchoServer();
    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  }, 60_000);

  afterAll(async () => {
    await client.close();
  });

  test("server exposes exactly one tool", async () => {
    const result = await client.listTools();
    expect(result.tools).toHaveLength(1);
  });

  test("tool name is 'echo'", async () => {
    const result = await client.listTools();
    expect(result.tools[0]?.name).toBe("echo");
  });

  test("callTool returns the input text", async () => {
    const callResult = await client.callTool({
      name: "echo",
      arguments: { text: "hello" },
    });
    const content = callResult.content as { type: string; text?: string }[];
    expect(content).toHaveLength(1);
    const block = content[0];
    expect(block?.type).toBe("text");
    if (block?.type === "text" && "text" in block) {
      expect(block.text).toBe("hello");
    }
  });
});
