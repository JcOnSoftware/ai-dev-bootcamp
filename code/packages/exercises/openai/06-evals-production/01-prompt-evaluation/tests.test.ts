import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-prompt-evaluation", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { output: string; score: number; reasoning: string } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { output: string; score: number; reasoning: string } | undefined;
  }, 60_000);

  test("makes exactly two API calls", () => {
    expect(calls).toHaveLength(2);
  });

  test("second call (judge) uses response_format json_schema", () => {
    const judgeCall = calls[1];
    const fmt = judgeCall?.request.response_format as { type?: string } | undefined;
    expect(fmt?.type).toBe("json_schema");
  });

  test("returns an output string", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn?.output).toBe("string");
    expect((userReturn?.output ?? "").length).toBeGreaterThan(0);
  });

  test("returns a score between 1 and 5", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn?.score).toBe("number");
    expect(userReturn!.score).toBeGreaterThanOrEqual(1);
    expect(userReturn!.score).toBeLessThanOrEqual(5);
  });

  test("returns a reasoning string", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn?.reasoning).toBe("string");
    expect((userReturn?.reasoning ?? "").length).toBeGreaterThan(0);
  });
});
