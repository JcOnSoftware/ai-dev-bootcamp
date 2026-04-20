import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface EmbeddingResult {
  dimensions: number;
  firstFive: number[];
  l2Norm: number;
}

describe("01-first-embedding", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: EmbeddingResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as EmbeddingResult | undefined;
  }, 90_000);

  test("makes exactly one embedContent call", () => {
    expect(calls).toHaveLength(1);
    expect(lastCall?.method).toBe("embedContent");
  });

  test("uses gemini-embedding-001", () => {
    const model = String(lastCall?.request["model"] ?? "");
    expect(model).toContain("gemini-embedding");
  });

  test("returns a 3072-dim vector by default", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn!.dimensions).toBe(3072);
  });

  test("firstFive are finite numbers", () => {
    expect(userReturn!.firstFive).toHaveLength(5);
    for (const v of userReturn!.firstFive) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  test("vector is approximately unit-length (L2 norm ≈ 1)", () => {
    // Gemini returns normalized embeddings by default — norm should be very close to 1.
    expect(userReturn!.l2Norm).toBeGreaterThan(0.95);
    expect(userReturn!.l2Norm).toBeLessThan(1.05);
  });
});
