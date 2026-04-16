import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { resolveExerciseFile } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

type ConnectResult = {
  tools: { name: string }[];
  searchResult: { content: { type: string; text?: string }[] };
};

describe("02-mcp-client-connect", () => {
  let result: ConnectResult;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const mod = (await import(EXERCISE_FILE)) as {
      connectResearchClient: () => Promise<{
        client: { listTools: () => Promise<{ tools: { name: string }[] }>; callTool: (args: { name: string; arguments: Record<string, unknown> }) => Promise<{ content: { type: string; text?: string }[] }>;  close: () => Promise<void> };
        cleanup: () => Promise<void>;
      }>;
    };

    const { client, cleanup: _cleanup } = await mod.connectResearchClient();
    cleanup = _cleanup;

    const toolsResult = await client.listTools();
    const searchResult = await client.callTool({
      name: "search_docs",
      arguments: { query: "caching" },
    });

    result = { tools: toolsResult.tools, searchResult };
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  test("lists 2 tools", () => {
    expect(result.tools).toHaveLength(2);
  });

  test("tool names match expected set", () => {
    const names = new Set(result.tools.map((t) => t.name));
    expect(names).toEqual(new Set(["search_docs", "read_chunk"]));
  });

  test("searchResult content is text type", () => {
    expect(result.searchResult.content[0]?.type).toBe("text");
  });
});
