import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface MultiStepResult {
  turnCount: number;
  toolCalls: string[];
  answer: string;
}

describe("02-multi-step-task", () => {
  let calls: CapturedCallGemini[];
  let userReturn: MultiStepResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as MultiStepResult | undefined;
  }, 90_000);

  test("makes at least 3 generateContent calls (user + 2 tool turns + final)", () => {
    const gen = calls.filter((c) => c.method === "generateContent");
    expect(gen.length).toBeGreaterThanOrEqual(3);
  });

  test("called BOTH tools across the loop (multiply AND add)", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn!.toolCalls).toContain("multiply");
    expect(userReturn!.toolCalls).toContain("add");
  });

  test("called multiply BEFORE add (order matters for (12*7)+9)", () => {
    const mulIdx = userReturn!.toolCalls.indexOf("multiply");
    const addIdx = userReturn!.toolCalls.indexOf("add");
    expect(mulIdx).toBeGreaterThanOrEqual(0);
    expect(addIdx).toBeGreaterThan(mulIdx);
  });

  test("final answer contains 93 (the correct result)", () => {
    expect(userReturn!.answer).toMatch(/\b93\b/);
  });

  test("returns { turnCount, toolCalls, answer } shape", () => {
    expect(typeof userReturn!.turnCount).toBe("number");
    expect(Array.isArray(userReturn!.toolCalls)).toBe(true);
    expect(typeof userReturn!.answer).toBe("string");
  });
});
