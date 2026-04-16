import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-mcp-in-agent-loop", () => {
  beforeAll(() => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — exercise 05 hits the real API.");
    }
  });

  test("iterations are within bounds (1-10)", async () => {
    const result = await runUserCode(EXERCISE_FILE);
    const userReturn = result.userReturn as {
      finalMessage: string;
      iterations: number;
      toolCalls: { name: string; input: unknown }[];
    };
    expect(userReturn.iterations).toBeGreaterThanOrEqual(1);
    expect(userReturn.iterations).toBeLessThanOrEqual(10);
  }, 60000);

  test("at least 1 tool call was made", async () => {
    const result = await runUserCode(EXERCISE_FILE);
    const userReturn = result.userReturn as { toolCalls: unknown[] };
    expect(userReturn.toolCalls.length).toBeGreaterThanOrEqual(1);
  }, 60000);

  test("final answer contains cost multiplier info", async () => {
    const result = await runUserCode(EXERCISE_FILE);
    const userReturn = result.userReturn as { finalMessage: string };
    const text = userReturn.finalMessage.toLowerCase();
    const hasCostInfo =
      text.includes("1.25") ||
      text.includes("25%") ||
      text.includes("2x") ||
      text.includes("100%") ||
      text.includes("multiplier") ||
      text.includes("times more expensive") ||
      text.includes("cache");
    expect(hasCostInfo).toBe(true);
  }, 60000);

  test("calls.length equals iterations", async () => {
    const result = await runUserCode(EXERCISE_FILE);
    const userReturn = result.userReturn as { iterations: number };
    expect(result.calls.length).toBe(userReturn.iterations);
  }, 60000);
});
