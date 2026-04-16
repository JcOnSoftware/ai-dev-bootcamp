import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-vector-search", () => {
  let calls: CapturedCallOpenAI[];
  let userReturn: { query: string; results: { text: string; similarity: number }[] } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real embeddings API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    userReturn = raw.userReturn as { query: string; results: { text: string; similarity: number }[] } | undefined;
  });

  test("embedding calls not captured by harness (only chat.completions is patched)", () => {
    expect(calls.length).toBe(0);
  });

  test("returns a query string", () => {
    expect(typeof userReturn?.query).toBe("string");
    expect(userReturn!.query.length).toBeGreaterThan(0);
  });

  test("returns a results array with at least 1 item", () => {
    expect(Array.isArray(userReturn?.results)).toBe(true);
    expect(userReturn!.results.length).toBeGreaterThan(0);
  });

  test("each result has text and similarity", () => {
    for (const result of userReturn?.results ?? []) {
      expect(typeof result.text).toBe("string");
      expect(result.text.length).toBeGreaterThan(0);
      expect(typeof result.similarity).toBe("number");
    }
  });

  test("similarity values are between -1 and 1", () => {
    for (const result of userReturn?.results ?? []) {
      expect(result.similarity).toBeGreaterThanOrEqual(-1);
      expect(result.similarity).toBeLessThanOrEqual(1);
    }
  });

  test("results are sorted descending by similarity", () => {
    const results = userReturn?.results ?? [];
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.similarity).toBeGreaterThanOrEqual(results[i]!.similarity);
    }
  });

  test("top result is about TypeScript (most relevant to query)", () => {
    const top = userReturn?.results[0];
    expect(top?.text).toMatch(/TypeScript/i);
  });
});
