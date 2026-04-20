import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-chunking-strategies", () => {
  let calls: CapturedCallOpenAI[];
  let userReturn: { chunks: string[]; chunkCount: number } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — set it even though this exercise has no API call.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    userReturn = raw.userReturn as { chunks: string[]; chunkCount: number } | undefined;
  }, 60_000);

  test("makes no API calls (pure algorithm)", () => {
    expect(calls).toHaveLength(0);
  });

  test("returns a chunks array with more than 1 chunk", () => {
    expect(Array.isArray(userReturn?.chunks)).toBe(true);
    expect(userReturn!.chunks.length).toBeGreaterThan(1);
  });

  test("each chunk has at most 250 characters (chunkSize=200 with tolerance)", () => {
    for (const chunk of userReturn?.chunks ?? []) {
      expect(chunk.length).toBeLessThanOrEqual(250);
    }
  });

  test("no empty chunks", () => {
    for (const chunk of userReturn?.chunks ?? []) {
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  test("chunkCount matches chunks.length", () => {
    expect(userReturn?.chunkCount).toBe(userReturn?.chunks.length);
  });
});
