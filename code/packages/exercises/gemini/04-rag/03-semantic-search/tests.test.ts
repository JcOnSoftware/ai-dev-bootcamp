import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface SearchHit {
  index: number;
  text: string;
  score: number;
}

describe("03-semantic-search", () => {
  let calls: CapturedCallGemini[];
  let userReturn: SearchHit[] | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as SearchHit[] | undefined;
  }, 120_000);

  test("makes at least 2 embedContent calls (corpus + query)", () => {
    const embeds = calls.filter((c) => c.method === "embedContent");
    expect(embeds.length).toBeGreaterThanOrEqual(2);
  });

  test("at least one call uses taskType RETRIEVAL_QUERY or RETRIEVAL_DOCUMENT", () => {
    const embeds = calls.filter((c) => c.method === "embedContent");
    const taskTypes = embeds.map((c) => {
      const config = c.request["config"] as Record<string, unknown> | undefined;
      return String(config?.["taskType"] ?? "");
    });
    const hasRetrievalTypes = taskTypes.some((t) => /RETRIEVAL/.test(t));
    expect(hasRetrievalTypes).toBe(true);
  });

  test("returns top K hits (K >= 1) with {index, text, score}", () => {
    expect(userReturn).toBeDefined();
    expect(Array.isArray(userReturn)).toBe(true);
    expect(userReturn!.length).toBeGreaterThanOrEqual(1);
    const first = userReturn![0]!;
    expect(typeof first.index).toBe("number");
    expect(typeof first.text).toBe("string");
    expect(typeof first.score).toBe("number");
  });

  test("results are sorted by score descending", () => {
    for (let i = 1; i < userReturn!.length; i += 1) {
      expect(userReturn![i - 1]!.score).toBeGreaterThanOrEqual(userReturn![i]!.score);
    }
  });

  test("top hit for 'How do cells produce energy?' is the mitochondrion sentence (index 0)", () => {
    expect(userReturn![0]!.index).toBe(0);
    expect(userReturn![0]!.text.toLowerCase()).toMatch(/mitochondri|cell|atp/);
  });
});
