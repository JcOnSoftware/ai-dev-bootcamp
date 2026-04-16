import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// ── Unit tests: mcpToolsToAnthropicFormat ─────────────────────────────────────
describe("unit — mcpToolsToAnthropicFormat", () => {
  test("preserves name and description", async () => {
    const mod = (await import(EXERCISE_FILE)) as {
      mcpToolsToAnthropicFormat: (tools: {
        name: string;
        description?: string;
        inputSchema: { type: "object"; properties?: Record<string, unknown> };
      }[]) => { name: string; description?: string; input_schema: unknown }[];
    };

    const mockTools = [
      {
        name: "search_docs",
        description: "Search docs corpus",
        inputSchema: { type: "object" as const, properties: { query: { type: "string" } } },
      },
    ];

    const result = mod.mcpToolsToAnthropicFormat(mockTools);
    expect(result[0]?.name).toBe("search_docs");
    expect(result[0]?.description).toBe("Search docs corpus");
  });

  test("renames inputSchema to input_schema", async () => {
    const mod = (await import(EXERCISE_FILE)) as {
      mcpToolsToAnthropicFormat: (tools: {
        name: string;
        description?: string;
        inputSchema: { type: "object"; properties?: Record<string, unknown> };
      }[]) => Record<string, unknown>[];
    };

    const mockTools = [
      {
        name: "read_chunk",
        inputSchema: { type: "object" as const, properties: { id: { type: "string" } } },
      },
    ];

    const result = mod.mcpToolsToAnthropicFormat(mockTools);
    expect(result[0]).toBeDefined();
    expect("input_schema" in (result[0] ?? {})).toBe(true);
    expect("inputSchema" in (result[0] ?? {})).toBe(false);
  });
});

// ── Integration tests: askClaudeWithMcpTools ──────────────────────────────────
describe("integration — askClaudeWithMcpTools", () => {
  beforeAll(() => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — exercise 04 hits the real API.");
    }
  });

  test("makes at least 1 tool call", async () => {
    const result = await runUserCode(EXERCISE_FILE);
    const userReturn = result.userReturn as { answer: string; toolCalls: { name: string; input: unknown }[] };
    expect(userReturn.toolCalls.length).toBeGreaterThanOrEqual(1);
  }, 30000);

  test("answer has meaningful content", async () => {
    const result = await runUserCode(EXERCISE_FILE);
    const userReturn = result.userReturn as { answer: string; toolCalls: unknown[] };
    expect(userReturn.answer.length).toBeGreaterThan(30);
  }, 30000);

  test("model matches haiku", async () => {
    const result = await runUserCode(EXERCISE_FILE);
    expect(result.calls[0]?.request.model).toMatch(/haiku/i);
  }, 30000);
});
