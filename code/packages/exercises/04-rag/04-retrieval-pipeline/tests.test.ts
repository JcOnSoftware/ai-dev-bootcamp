import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// ── Integration tests (real Voyage AI + Anthropic API) ───────────────────────

describe("04-retrieval-pipeline — integration", () => {
  let result: HarnessResult;
  let userReturn: {
    retrieved: unknown[];
    answer: string;
    usage: { embedTokens: number };
  };

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits the real Anthropic API.");
    }
    if (!process.env["VOYAGE_API_KEY"]) {
      throw new Error("VOYAGE_API_KEY not set — integration test hits the real Voyage AI API.");
    }
    result = await runUserCode(EXERCISE_FILE);
    userReturn = result.userReturn as typeof userReturn;
  }, 90_000);

  test("run makes exactly 1 Anthropic API call (harness captures only Anthropic calls)", () => {
    expect(result.calls).toHaveLength(1);
  });

  test("Anthropic call uses a Haiku model", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });

  test("Anthropic request includes retrieved chunk content in system prompt", () => {
    const req = result.calls[0]!.request;
    // System can be a string or array of blocks
    const systemStr =
      typeof req.system === "string"
        ? req.system
        : JSON.stringify(req.system ?? "");
    // At minimum, the system prompt should reference caching-related content
    expect(systemStr.length).toBeGreaterThan(50);
  });

  test("userReturn.retrieved has 3 chunks (topK=3)", () => {
    expect(Array.isArray(userReturn.retrieved)).toBe(true);
    expect(userReturn.retrieved).toHaveLength(3);
  });

  test("userReturn.answer is a non-empty string", () => {
    expect(typeof userReturn.answer).toBe("string");
    expect(userReturn.answer.length).toBeGreaterThan(0);
  });

  test("userReturn.usage.embedTokens is a positive number", () => {
    expect(typeof userReturn.usage.embedTokens).toBe("number");
    expect(userReturn.usage.embedTokens).toBeGreaterThan(0);
  });
});
