import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-token-usage-cost", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { response: unknown; cost: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { response: unknown; cost: unknown } | undefined;
  });

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("uses gpt-4.1-nano", () => {
    expect(lastCall?.request.model).toBe("gpt-4.1-nano");
  });

  test("reports prompt_tokens > 0", () => {
    expect(lastCall?.response.usage?.prompt_tokens).toBeGreaterThan(0);
  });

  test("reports completion_tokens > 0", () => {
    expect(lastCall?.response.usage?.completion_tokens).toBeGreaterThan(0);
  });

  test("returns a cost property that is a positive number", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn?.cost).toBe("number");
    expect(userReturn!.cost as number).toBeGreaterThan(0);
  });

  test("returns a response property", () => {
    expect(userReturn).toHaveProperty("response");
  });
});
