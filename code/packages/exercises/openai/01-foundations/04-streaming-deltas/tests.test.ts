import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-streaming-deltas", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { chunks: unknown; fullText: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { chunks: unknown; fullText: unknown } | undefined;
  });

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("the call uses stream: true", () => {
    expect(lastCall?.request.stream).toBe(true);
  });

  test("the captured call is marked as streamed", () => {
    expect(lastCall?.streamed).toBe(true);
  });

  test("returns a chunks array with at least one element", () => {
    expect(userReturn).toBeDefined();
    expect(Array.isArray(userReturn?.chunks)).toBe(true);
    expect((userReturn!.chunks as string[]).length).toBeGreaterThan(0);
  });

  test("returns a non-empty fullText string", () => {
    expect(typeof userReturn?.fullText).toBe("string");
    expect((userReturn!.fullText as string).length).toBeGreaterThan(0);
  });

  test("fullText equals chunks joined", () => {
    const chunks = userReturn?.chunks as string[];
    const fullText = userReturn?.fullText as string;
    expect(fullText).toBe(chunks.join(""));
  });
});
