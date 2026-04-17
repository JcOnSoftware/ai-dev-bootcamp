import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface ThinkingReport {
  thoughtsTokenCount: number;
  candidatesTokenCount: number;
  answer: string;
}

describe("01-thinking-budget", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: ThinkingReport | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as ThinkingReport | undefined;
  }, 60_000);

  test("makes exactly one generateContent call", () => {
    expect(calls.filter((c) => c.method === "generateContent")).toHaveLength(1);
  });

  test("request config sets thinkingConfig.thinkingBudget", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const tc = config?.["thinkingConfig"] as Record<string, unknown> | undefined;
    expect(tc).toBeDefined();
    expect(typeof tc?.["thinkingBudget"]).toBe("number");
    expect((tc?.["thinkingBudget"] as number) > 0).toBe(true);
  });

  test("uses a 2.5 model (thinking requires 2.5+)", () => {
    const model = String(lastCall?.request["model"] ?? "");
    expect(model).toMatch(/gemini-2\.5/);
  });

  test("returns { thoughtsTokenCount, candidatesTokenCount, answer }", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.thoughtsTokenCount).toBe("number");
    expect(typeof userReturn!.candidatesTokenCount).toBe("number");
    expect(typeof userReturn!.answer).toBe("string");
  });

  test("thinking was actually used (thoughtsTokenCount > 0)", () => {
    expect(userReturn!.thoughtsTokenCount).toBeGreaterThan(0);
  });

  test("model produced a visible answer (candidatesTokenCount > 0)", () => {
    expect(userReturn!.candidatesTokenCount).toBeGreaterThan(0);
    expect(userReturn!.answer.length).toBeGreaterThan(0);
  });
});
