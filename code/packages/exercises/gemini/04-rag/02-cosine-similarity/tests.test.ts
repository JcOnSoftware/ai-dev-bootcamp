import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface SimilarityReport {
  relatedScore: number;
  unrelatedScore: number;
}

describe("02-cosine-similarity", () => {
  let calls: CapturedCallGemini[];
  let userReturn: SimilarityReport | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as SimilarityReport | undefined;
  }, 30_000);

  test("makes at least one embedContent call", () => {
    const embeds = calls.filter((c) => c.method === "embedContent");
    expect(embeds.length).toBeGreaterThan(0);
  });

  test("returns { relatedScore, unrelatedScore } as finite numbers", () => {
    expect(userReturn).toBeDefined();
    expect(Number.isFinite(userReturn!.relatedScore)).toBe(true);
    expect(Number.isFinite(userReturn!.unrelatedScore)).toBe(true);
  });

  test("scores are in valid cosine range [-1, 1]", () => {
    expect(userReturn!.relatedScore).toBeGreaterThanOrEqual(-1);
    expect(userReturn!.relatedScore).toBeLessThanOrEqual(1);
    expect(userReturn!.unrelatedScore).toBeGreaterThanOrEqual(-1);
    expect(userReturn!.unrelatedScore).toBeLessThanOrEqual(1);
  });

  test("related sentences (dogs + cats) score HIGHER than unrelated (dogs + PHP)", () => {
    // The whole point of embeddings: semantically related > unrelated.
    expect(userReturn!.relatedScore).toBeGreaterThan(userReturn!.unrelatedScore);
  });

  test("the delta is meaningful (at least 0.05)", () => {
    const delta = userReturn!.relatedScore - userReturn!.unrelatedScore;
    expect(delta).toBeGreaterThan(0.05);
  });
});
