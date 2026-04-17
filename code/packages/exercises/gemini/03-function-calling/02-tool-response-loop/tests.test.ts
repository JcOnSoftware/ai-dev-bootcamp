import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface LoopResult {
  answer: string;
  calledFunction: string;
  calledArgs: Record<string, unknown>;
  turnCount: number;
}

describe("02-tool-response-loop", () => {
  let calls: CapturedCallGemini[];
  let userReturn: LoopResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as LoopResult | undefined;
  }, 60_000);

  test("makes exactly two generateContent calls (turn 1 + turn 2)", () => {
    expect(calls).toHaveLength(2);
  });

  test("turn 2's contents includes a functionResponse part", () => {
    const turn2Contents = calls[1]!.request["contents"];
    // The user's turn-2 contents should be an array with role+parts conversation.
    expect(Array.isArray(turn2Contents)).toBe(true);
    const items = turn2Contents as Array<{ role?: string; parts?: Array<Record<string, unknown>> }>;
    const hasFunctionResponse = items.some(
      (m) =>
        Array.isArray(m.parts) &&
        m.parts.some((p) => typeof p["functionResponse"] === "object" && p["functionResponse"] !== null),
    );
    expect(hasFunctionResponse).toBe(true);
  });

  test("turn 2's contents also includes the prior functionCall from the model", () => {
    const turn2Contents = calls[1]!.request["contents"];
    const items = turn2Contents as Array<{ role?: string; parts?: Array<Record<string, unknown>> }>;
    const hasFunctionCall = items.some(
      (m) =>
        m.role === "model" &&
        Array.isArray(m.parts) &&
        m.parts.some((p) => typeof p["functionCall"] === "object" && p["functionCall"] !== null),
    );
    expect(hasFunctionCall).toBe(true);
  });

  test("returns a non-empty natural-language answer", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn!.answer.length).toBeGreaterThan(0);
  });

  test("turnCount is 2", () => {
    expect(userReturn!.turnCount).toBe(2);
  });

  test("calledFunction + calledArgs captured from turn 1", () => {
    expect(userReturn!.calledFunction.toLowerCase()).toMatch(/weather/);
    expect(typeof userReturn!.calledArgs["location"]).toBe("string");
  });

  test("the final answer mentions the tool's stub conditions (partly cloudy or 18°)", () => {
    // The stub returns temperatureC: 18 and conditions: "partly cloudy". A
    // well-behaved model grounds its natural-language answer in that data.
    const ans = userReturn!.answer.toLowerCase();
    expect(/partly cloudy|cloudy|18/.test(ans)).toBe(true);
  });
});
