import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface AgentResult {
  turnCount: number;
  toolCalls: string[];
  answer: string;
}

describe("01-agent-loop", () => {
  let calls: CapturedCallGemini[];
  let userReturn: AgentResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as AgentResult | undefined;
  }, 120_000);

  test("makes at least 2 generateContent calls (loop ran multiple turns)", () => {
    const gen = calls.filter((c) => c.method === "generateContent");
    expect(gen.length).toBeGreaterThanOrEqual(2);
  });

  test("reaches a final turn with no function call (termination)", () => {
    // The harness captures both turns. The LAST captured call's response
    // should NOT have function calls in its candidates' parts.
    const last = calls[calls.length - 1]!;
    const candidates = last.response["candidates"] as Array<{
      content: { parts: Array<Record<string, unknown>> };
    }>;
    const parts = candidates?.[0]?.content.parts ?? [];
    const hasFunctionCall = parts.some((p) => typeof p["functionCall"] === "object" && p["functionCall"] !== null);
    expect(hasFunctionCall).toBe(false);
  });

  test("returns { turnCount: number, toolCalls: string[], answer: string }", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.turnCount).toBe("number");
    expect(Array.isArray(userReturn!.toolCalls)).toBe(true);
    expect(typeof userReturn!.answer).toBe("string");
  });

  test("called the multiply tool at least once", () => {
    expect(userReturn!.toolCalls.length).toBeGreaterThanOrEqual(1);
    expect(userReturn!.toolCalls.every((n) => n === "multiply")).toBe(true);
  });

  test("turnCount matches the number of generateContent calls the harness saw", () => {
    const gen = calls.filter((c) => c.method === "generateContent");
    expect(userReturn!.turnCount).toBe(gen.length);
  });

  test("final answer contains 1554 (the product of 37 × 42)", () => {
    expect(userReturn!.answer).toMatch(/1[,.]?554/);
  });
});
