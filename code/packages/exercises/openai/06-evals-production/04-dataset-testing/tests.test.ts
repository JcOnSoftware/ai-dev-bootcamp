import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-dataset-testing", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: {
    totalTests: number;
    passed: number;
    failed: number;
    accuracy: number;
  } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as {
      totalTests: number;
      passed: number;
      failed: number;
      accuracy: number;
    } | undefined;
  });

  test("makes exactly 5 API calls (one per dataset entry)", () => {
    expect(calls).toHaveLength(5);
  });

  test("totalTests is 5", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn?.totalTests).toBe(5);
  });

  test("passed + failed equals totalTests", () => {
    expect(userReturn).toBeDefined();
    expect((userReturn?.passed ?? 0) + (userReturn?.failed ?? 0)).toBe(5);
  });

  test("accuracy is a number between 0 and 1", () => {
    expect(typeof userReturn?.accuracy).toBe("number");
    expect(userReturn!.accuracy).toBeGreaterThanOrEqual(0);
    expect(userReturn!.accuracy).toBeLessThanOrEqual(1);
  });

  test("at least 3 tests pass (simple factual questions)", () => {
    expect(userReturn!.passed).toBeGreaterThanOrEqual(3);
  });

  test("last call uses gpt-4.1-nano", () => {
    expect(lastCall?.request.model).toBe("gpt-4.1-nano");
  });
});
