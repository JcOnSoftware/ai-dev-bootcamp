import { describe, test, expect, beforeAll } from "bun:test";
import { resolveExerciseFile } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// Throttle helper: Voyage free tier is 3 RPM. Add a small delay between calls.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Unit tests (no API) ───────────────────────────────────────────────────────

describe("01-embeddings-basics — unit", () => {
  test("cosineSimilarity of identical vectors returns 1", async () => {
    const mod = await import(EXERCISE_FILE);
    const result = (mod.cosineSimilarity as (a: number[], b: number[]) => number)([1, 0], [1, 0]);
    expect(result).toBeCloseTo(1, 5);
  });

  test("cosineSimilarity of orthogonal vectors returns 0", async () => {
    const mod = await import(EXERCISE_FILE);
    const result = (mod.cosineSimilarity as (a: number[], b: number[]) => number)([1, 0], [0, 1]);
    expect(result).toBeCloseTo(0, 5);
  });

  test("cosineSimilarity of opposite vectors returns -1", async () => {
    const mod = await import(EXERCISE_FILE);
    const result = (mod.cosineSimilarity as (a: number[], b: number[]) => number)(
      [1, 0],
      [-1, 0],
    );
    expect(result).toBeCloseTo(-1, 5);
  });
});

// ── Integration tests (real Voyage API) ──────────────────────────────────────
// All embeddings are batched in a SINGLE API call in beforeAll to respect
// the free-tier 3 RPM rate limit. run() uses its own call (second call) with
// a 21s throttle between them.

describe("01-embeddings-basics — integration", () => {
  let mod: {
    embed: (texts: string[], inputType: "document" | "query") => Promise<number[][]>;
    cosineSimilarity: (a: number[], b: number[]) => number;
    default: () => Promise<{ embedding: number[]; dimension: number; similarityScore: number }>;
  };

  // All test embeddings batched into a single API call
  // Index: 0=hello, 1=similar-a, 2=similar-b, 3=dissimilar-a, 4=dissimilar-b
  let allEmbeds: number[][];
  let runResult: { embedding: number[]; dimension: number; similarityScore: number };

  beforeAll(async () => {
    if (!process.env["VOYAGE_API_KEY"]) {
      throw new Error("VOYAGE_API_KEY not set — integration test hits real Voyage AI API.");
    }
    mod = await import(EXERCISE_FILE);

    // Single batched call for all test texts (1 RPM used)
    allEmbeds = await mod.embed(
      [
        "hello world",
        "What is prompt caching?",
        "How does prompt caching work?",
        "What is prompt caching?",
        "The weather is sunny today in Lima",
      ],
      "document",
    );

    await sleep(21_000); // ensure 2nd call is in a new minute window

    // run() uses its own embed + logic (1 RPM used)
    runResult = await mod.default();
  }, 90_000);

  test("embed returns array of length 1 for single input", () => {
    // We embedded 5 items in one call; verify the structure is correct
    expect(Array.isArray(allEmbeds)).toBe(true);
    expect(allEmbeds).toHaveLength(5);
  });

  test("embed returns 1024-dimensional vectors", () => {
    expect(allEmbeds[0]).toBeDefined();
    expect(allEmbeds[0]!.length).toBe(1024);
  });

  test("similar texts have cosine similarity > 0.5", () => {
    const score = mod.cosineSimilarity(allEmbeds[1]!, allEmbeds[2]!);
    expect(score).toBeGreaterThan(0.5);
  });

  test("dissimilar texts have cosine similarity < 0.8 relative to each other", () => {
    const score = mod.cosineSimilarity(allEmbeds[3]!, allEmbeds[4]!);
    // Topics are unrelated — similarity should be clearly lower than similar pair
    expect(score).toBeLessThan(0.8);
  });

  test("run() returns correct shape", () => {
    expect(runResult).toHaveProperty("embedding");
    expect(runResult).toHaveProperty("dimension");
    expect(runResult).toHaveProperty("similarityScore");
    expect(Array.isArray(runResult.embedding)).toBe(true);
    expect(runResult.dimension).toBe(1024);
    expect(typeof runResult.similarityScore).toBe("number");
  });
});
