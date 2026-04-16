import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-multiple-tools", () => {
  let result: HarnessResult;

  // ── Unit tests: helpers (no API) ──────────────────────────────────────────
  test("executeCalculate multiply returns correct string", async () => {
    const mod = (await import(`${EXERCISE_FILE}?t=${Date.now()}`)) as {
      executeCalculate: (input: { operation: string; a: number; b: number }) => string;
    };
    const output = mod.executeCalculate({ operation: "multiply", a: 6, b: 7 });
    const parsed = JSON.parse(output) as { result: number };
    expect(parsed.result).toBe(42);
  });

  test("executeCalculate divide by zero throws", async () => {
    const mod = (await import(`${EXERCISE_FILE}?t=${Date.now()}`)) as {
      executeCalculate: (input: { operation: string; a: number; b: number }) => string;
    };
    expect(() => mod.executeCalculate({ operation: "divide", a: 10, b: 0 })).toThrow();
  });

  // ── Integration tests ─────────────────────────────────────────────────────
  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 45_000);

  test("calls.length is 2", () => {
    expect(result.calls).toHaveLength(2);
  });

  test("calls[0].request.tools.length is 2", () => {
    const tools = result.calls[0]!.request.tools as unknown[];
    expect(tools.length).toBe(2);
  });

  test("tool chosen is calculate", () => {
    const toolUseBlock = result.calls[0]!.response.content.find(
      (b) => b.type === "tool_use",
    ) as { type: string; name: string; input: { operation?: string } } | undefined;
    expect(toolUseBlock).toBeDefined();
    expect(toolUseBlock!.name).toBe("calculate");
  });

  test("calculate input has operation multiply", () => {
    const toolUseBlock = result.calls[0]!.response.content.find(
      (b) => b.type === "tool_use",
    ) as { type: string; name: string; input: { operation: string } } | undefined;
    expect(toolUseBlock!.input.operation).toBe("multiply");
  });

  test("final response text matches /5254|5,254/", () => {
    const lastContent = result.calls[1]!.response.content;
    const textBlock = lastContent.find((b) => b.type === "text") as
      | { type: string; text: string }
      | undefined;
    expect(textBlock).toBeDefined();
    expect(textBlock!.text).toMatch(/5254|5,254/);
  });

  test("model is haiku", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });
});
