import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface RagAnswer {
  usedChunkIds: number[];
  answer: string;
}

describe("05-rag-pipeline", () => {
  let calls: CapturedCallGemini[];
  let userReturn: RagAnswer | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as RagAnswer | undefined;
  }, 60_000);

  test("makes at least 2 embedContent calls (corpus + query) AND 1 generateContent call", () => {
    const embeds = calls.filter((c) => c.method === "embedContent");
    const generates = calls.filter((c) => c.method === "generateContent");
    expect(embeds.length).toBeGreaterThanOrEqual(2);
    expect(generates.length).toBe(1);
  });

  test("returns { usedChunkIds, answer }", () => {
    expect(userReturn).toBeDefined();
    expect(Array.isArray(userReturn!.usedChunkIds)).toBe(true);
    expect(typeof userReturn!.answer).toBe("string");
  });

  test("retrieved chunk IDs are integers within the article range (0..3)", () => {
    expect(userReturn!.usedChunkIds.length).toBeGreaterThan(0);
    for (const id of userReturn!.usedChunkIds) {
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThanOrEqual(3);
    }
  });

  test("retrieval surfaced the disease paragraph (index 3)", () => {
    expect(userReturn!.usedChunkIds).toContain(3);
  });

  test("generateContent prompt included the retrieved chunk text", () => {
    const generateCall = calls.find((c) => c.method === "generateContent");
    const contents = String(generateCall?.request["contents"] ?? "");
    // The disease chunk mentions Parkinson's and Alzheimer's — if the prompt
    // was properly stuffed, those words must appear in what we sent to the LLM.
    expect(/parkinson|alzheimer/i.test(contents)).toBe(true);
  });

  test("generated answer is grounded in the sources (mentions the disease names or 'not in the sources')", () => {
    const ans = userReturn!.answer.toLowerCase();
    // Either the model used the context (expected) or honored the "not in sources"
    // guard. Both paths prove the prompt contract is working.
    expect(
      /parkinson|alzheimer|neurodegenerative|mitochondrial.*disease|not in the sources/.test(ans),
    ).toBe(true);
  });
});
