import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface PlanExecuteResult {
  firstTurnText: string;
  toolCalls: string[];
  answer: string;
}

describe("03-plan-then-execute", () => {
  let calls: CapturedCallGemini[];
  let userReturn: PlanExecuteResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as PlanExecuteResult | undefined;
  }, 90_000);

  test("every turn sends a systemInstruction", () => {
    for (const c of calls) {
      const config = c.request["config"] as Record<string, unknown> | undefined;
      expect(typeof config?.["systemInstruction"]).toBe("string");
      expect(String(config?.["systemInstruction"]).length).toBeGreaterThan(20);
    }
  });

  test("first turn's response included a visible plan (non-empty text)", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn!.firstTurnText.length).toBeGreaterThan(10);
  });

  test("plan mentions BOTH tools by name (multiply + add)", () => {
    const planLower = userReturn!.firstTurnText.toLowerCase();
    expect(/multiply/.test(planLower)).toBe(true);
    expect(/add/.test(planLower)).toBe(true);
  });

  test("tools were called in the correct order", () => {
    const mulIdx = userReturn!.toolCalls.indexOf("multiply");
    const addIdx = userReturn!.toolCalls.indexOf("add");
    expect(mulIdx).toBeGreaterThanOrEqual(0);
    expect(addIdx).toBeGreaterThan(mulIdx);
  });

  test("final answer contains 89 (= 8 * 9 + 17)", () => {
    expect(userReturn!.answer).toMatch(/\b89\b/);
  });
});
