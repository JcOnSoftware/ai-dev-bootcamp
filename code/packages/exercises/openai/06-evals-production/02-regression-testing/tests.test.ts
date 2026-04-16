import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface TestResult {
  input: string;
  output: string;
  passed: boolean;
}

describe("02-regression-testing", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { results: TestResult[]; passRate: number } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { results: TestResult[]; passRate: number } | undefined;
  });

  test("makes exactly 3 API calls (one per test case)", () => {
    expect(calls).toHaveLength(3);
  });

  test("returns results array with 3 entries", () => {
    expect(userReturn).toBeDefined();
    expect(Array.isArray(userReturn?.results)).toBe(true);
    expect(userReturn?.results).toHaveLength(3);
  });

  test("each result has input, output, and passed fields", () => {
    for (const result of userReturn?.results ?? []) {
      expect(typeof result.input).toBe("string");
      expect(typeof result.output).toBe("string");
      expect(typeof result.passed).toBe("boolean");
    }
  });

  test("passRate is a number between 0 and 1", () => {
    expect(typeof userReturn?.passRate).toBe("number");
    expect(userReturn!.passRate).toBeGreaterThanOrEqual(0);
    expect(userReturn!.passRate).toBeLessThanOrEqual(1);
  });

  test("last call uses gpt-4.1-nano", () => {
    expect(lastCall?.request.model).toBe("gpt-4.1-nano");
  });
});
