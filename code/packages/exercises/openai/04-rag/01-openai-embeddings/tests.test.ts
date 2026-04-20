import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-openai-embeddings", () => {
  let calls: CapturedCallOpenAI[];
  let userReturn:
    | {
        embeddings: { embedding: number[]; index: number; object: string }[];
        dimensions: number;
      }
    | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    userReturn = raw.userReturn as typeof userReturn;
  }, 60_000);

  test("embeddings API calls are not captured by harness (embedding, not chat)", () => {
    // The harness only intercepts chat.completions.create — embedding calls go through
    // unpatched. This is expected: we test via userReturn instead.
    expect(calls.length).toBe(0);
  });

  test("returns an embeddings array with 2 items", () => {
    expect(Array.isArray(userReturn?.embeddings)).toBe(true);
    expect(userReturn?.embeddings).toHaveLength(2);
  });

  test("each embedding item has a numeric array", () => {
    for (const item of userReturn?.embeddings ?? []) {
      expect(Array.isArray(item.embedding)).toBe(true);
      expect(item.embedding.length).toBeGreaterThan(0);
      expect(typeof item.embedding[0]).toBe("number");
    }
  });

  test("dimensions is 1536 (default for text-embedding-3-small)", () => {
    expect(userReturn?.dimensions).toBe(1536);
  });

  test("dimensions matches actual embedding length", () => {
    const firstEmbedding = userReturn?.embeddings[0]?.embedding;
    expect(firstEmbedding?.length).toBe(userReturn?.dimensions);
  });
});
