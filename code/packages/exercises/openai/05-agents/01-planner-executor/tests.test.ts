import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-planner-executor", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { steps: number; finalAnswer: string } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { steps: number; finalAnswer: string } | undefined;
  }, 60_000);

  test("makes at least 2 API calls (loop had at least one tool round-trip)", () => {
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  test("first call response has finish_reason 'tool_calls'", () => {
    expect(calls[0]?.response.choices[0]?.finish_reason).toBe("tool_calls");
  });

  test("last call response has finish_reason 'stop'", () => {
    expect(lastCall?.response.choices[0]?.finish_reason).toBe("stop");
  });

  test("userReturn has steps as a number >= 1", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn?.steps).toBe("number");
    expect((userReturn?.steps ?? 0)).toBeGreaterThanOrEqual(1);
  });

  test("userReturn has finalAnswer as a non-empty string", () => {
    expect(typeof userReturn?.finalAnswer).toBe("string");
    expect((userReturn?.finalAnswer ?? "").length).toBeGreaterThan(0);
  });
});
