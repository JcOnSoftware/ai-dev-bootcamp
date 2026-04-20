import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-model-selection", () => {
  let calls: CapturedCallOpenAI[];
  let userReturn: { nano: unknown; mini: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    userReturn = raw.userReturn as { nano: unknown; mini: unknown } | undefined;
  }, 60_000);

  test("makes exactly two API calls", () => {
    expect(calls).toHaveLength(2);
  });

  test("both models are present — nano and gpt-4o-mini", () => {
    const models = calls.map((c) => c.request.model);
    expect(models).toContain("gpt-4.1-nano");
    expect(models).toContain("gpt-4o-mini");
  });

  test("both calls receive a response with content", () => {
    for (const call of calls) {
      expect(call.response.choices.length).toBeGreaterThan(0);
      const content = call.response.choices[0]?.message?.content;
      expect(content).toBeDefined();
      expect(content!.length).toBeGreaterThan(0);
    }
  });

  test("both calls report token usage", () => {
    for (const call of calls) {
      expect(call.response.usage?.prompt_tokens).toBeGreaterThan(0);
      expect(call.response.usage?.completion_tokens).toBeGreaterThan(0);
    }
  });

  test("returns { nano, mini } object", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn).toHaveProperty("nano");
    expect(userReturn).toHaveProperty("mini");
  });
});
