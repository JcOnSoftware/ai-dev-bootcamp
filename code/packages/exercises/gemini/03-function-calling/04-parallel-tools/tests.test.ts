import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface ParallelResult {
  calledFunctions: string[];
  locations: string[];
}

describe("04-parallel-tools", () => {
  let calls: CapturedCallGemini[];
  let userReturn: ParallelResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as ParallelResult | undefined;
  }, 30_000);

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("returns { calledFunctions: [], locations: [] }", () => {
    expect(userReturn).toBeDefined();
    expect(Array.isArray(userReturn!.calledFunctions)).toBe(true);
    expect(Array.isArray(userReturn!.locations)).toBe(true);
  });

  test("Gemini returned multiple function calls in one response (parallel)", () => {
    // The prompt mentions 3 cities; the model should emit 2-3 parallel calls.
    // Accept >= 2 as a passing signal (sometimes a strong model batches 2+1).
    expect(userReturn!.calledFunctions.length).toBeGreaterThanOrEqual(2);
  });

  test("every call is to get_weather", () => {
    for (const name of userReturn!.calledFunctions) {
      expect(name).toBe("get_weather");
    }
  });

  test("locations cover the cities mentioned in the prompt", () => {
    const joined = userReturn!.locations.join(" | ").toLowerCase();
    // The prompt cited Tokyo, Buenos Aires, Berlin. Assert at least 2 of 3
    // are present — lets the model merge/skip one without failing.
    const hits = [/tokyo/, /buenos aires/, /berlin/].filter((r) => r.test(joined));
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });
});
