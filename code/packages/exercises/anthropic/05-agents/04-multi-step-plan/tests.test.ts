import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-multi-step-plan", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("at least 2 API calls were made", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(2);
  });

  test("call count is between 2 and 10", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(2);
    expect(result.calls.length).toBeLessThanOrEqual(10);
  });

  test("model is haiku", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });

  test("system prompt contains explicit planning instruction", () => {
    const systemPrompt = result.calls[0]!.request.system;
    expect(typeof systemPrompt).toBe("string");
    // Must instruct Claude to plan steps — keyword check
    const lowerSystem = (systemPrompt as string).toLowerCase();
    const hasPlanInstruction =
      lowerSystem.includes("plan") ||
      lowerSystem.includes("step") ||
      lowerSystem.includes("sub-question") ||
      lowerSystem.includes("break");
    expect(hasPlanInstruction).toBe(true);
  });

  test("at least 2 distinct search_docs queries were made", () => {
    // Collect all tool_use blocks across all calls
    const searchQueries = new Set<string>();
    for (const call of result.calls) {
      for (const block of call.response.content) {
        if (block.type === "tool_use" && block.name === "search_docs") {
          const input = block.input as { query: string };
          searchQueries.add(input.query.toLowerCase());
        }
      }
    }
    expect(searchQueries.size).toBeGreaterThanOrEqual(2);
  });

  test("final answer mentions cache write cost increase (25% or 1.25x)", () => {
    const lastCall = result.calls[result.calls.length - 1]!;
    const textBlock = lastCall.response.content.find((b) => b.type === "text");
    expect(textBlock).toBeDefined();
    const text = (textBlock as { type: string; text: string }).text;
    // Cache writes cost 25% more = 1.25x multiplier — accept either form
    const hasWriteMultiplier =
      text.includes("1.25") || text.includes("25%") || text.includes("25 percent");
    expect(hasWriteMultiplier).toBe(true);
  });

  test("final answer mentions cache read savings (10% or 0.1 or 90% cheaper)", () => {
    const lastCall = result.calls[result.calls.length - 1]!;
    const textBlock = lastCall.response.content.find((b) => b.type === "text");
    const text = (textBlock as { type: string; text: string }).text;
    // Cache reads cost 10% of base = 90% cheaper — accept any reasonable expression
    const hasReadMultiplier =
      text.includes("0.1") ||
      text.includes("10%") ||
      text.includes("10 percent") ||
      text.includes("90%") ||
      text.includes("cheaper");
    expect(hasReadMultiplier).toBe(true);
  });
});
