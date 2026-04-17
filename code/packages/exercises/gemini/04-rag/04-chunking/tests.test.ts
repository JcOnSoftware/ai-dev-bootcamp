import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface Chunk {
  id: number;
  text: string;
  score: number;
}

describe("04-chunking", () => {
  let calls: CapturedCallGemini[];
  let userReturn: Chunk[] | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as Chunk[] | undefined;
  }, 60_000);

  test("makes at least 2 embedContent calls (chunks + query)", () => {
    const embeds = calls.filter((c) => c.method === "embedContent");
    expect(embeds.length).toBeGreaterThanOrEqual(2);
  });

  test("the corpus call batched multiple chunks (contents is an array)", () => {
    const embeds = calls.filter((c) => c.method === "embedContent");
    const hasBatch = embeds.some((c) => Array.isArray(c.request["contents"]));
    expect(hasBatch).toBe(true);
  });

  test("returns 4 chunks (one per paragraph of the article)", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn).toHaveLength(4);
  });

  test("each chunk entry has { id: number, text: string, score: number }", () => {
    for (const c of userReturn!) {
      expect(typeof c.id).toBe("number");
      expect(typeof c.text).toBe("string");
      expect(typeof c.score).toBe("number");
      expect(c.text.length).toBeGreaterThan(0);
    }
  });

  test("results are sorted descending by score", () => {
    for (let i = 1; i < userReturn!.length; i += 1) {
      expect(userReturn![i - 1]!.score).toBeGreaterThanOrEqual(userReturn![i]!.score);
    }
  });

  test("top chunk mentions Parkinson's or Alzheimer's (the disease paragraph)", () => {
    const top = userReturn![0]!.text.toLowerCase();
    expect(/parkinson|alzheimer|disease/.test(top)).toBe(true);
  });
});
