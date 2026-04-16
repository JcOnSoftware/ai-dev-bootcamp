import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface Scores {
  relevance: number;
  accuracy: number;
  tone: number;
  overall: number;
  feedback: string;
}

describe("03-output-scoring", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { answer: string; scores: Scores } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { answer: string; scores: Scores } | undefined;
  });

  test("makes exactly 2 API calls", () => {
    expect(calls).toHaveLength(2);
  });

  test("second call uses response_format json_schema", () => {
    const secondCall = calls[1];
    const fmt = secondCall?.request.response_format as { type?: string } | undefined;
    expect(fmt?.type).toBe("json_schema");
  });

  test("returns an answer string", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn?.answer).toBe("string");
    expect((userReturn?.answer ?? "").length).toBeGreaterThan(0);
  });

  test("scores.relevance is between 1 and 5", () => {
    expect(typeof userReturn?.scores?.relevance).toBe("number");
    expect(userReturn!.scores.relevance).toBeGreaterThanOrEqual(1);
    expect(userReturn!.scores.relevance).toBeLessThanOrEqual(5);
  });

  test("scores.accuracy is between 1 and 5", () => {
    expect(typeof userReturn?.scores?.accuracy).toBe("number");
    expect(userReturn!.scores.accuracy).toBeGreaterThanOrEqual(1);
    expect(userReturn!.scores.accuracy).toBeLessThanOrEqual(5);
  });

  test("scores.tone is between 1 and 5", () => {
    expect(typeof userReturn?.scores?.tone).toBe("number");
    expect(userReturn!.scores.tone).toBeGreaterThanOrEqual(1);
    expect(userReturn!.scores.tone).toBeLessThanOrEqual(5);
  });

  test("scores.overall is between 1 and 5", () => {
    expect(typeof userReturn?.scores?.overall).toBe("number");
    expect(userReturn!.scores.overall).toBeGreaterThanOrEqual(1);
    expect(userReturn!.scores.overall).toBeLessThanOrEqual(5);
  });

  test("scores.feedback is a non-empty string", () => {
    expect(typeof userReturn?.scores?.feedback).toBe("string");
    expect((userReturn?.scores?.feedback ?? "").length).toBeGreaterThan(0);
  });
});
