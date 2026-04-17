import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
}

describe("05-structured-output", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: SentimentResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as SentimentResult | undefined;
  }, 30_000);

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("request config sets responseMimeType to application/json", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    expect(config?.["responseMimeType"]).toBe("application/json");
  });

  test("request config includes a responseSchema describing sentiment + confidence", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const schema = config?.["responseSchema"] as Record<string, unknown> | undefined;
    expect(schema).toBeDefined();
    const properties = schema?.["properties"] as Record<string, unknown> | undefined;
    expect(properties?.["sentiment"]).toBeDefined();
    expect(properties?.["confidence"]).toBeDefined();
  });

  test("returns an object with sentiment and confidence", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.sentiment).toBe("string");
    expect(typeof userReturn!.confidence).toBe("number");
  });

  test("sentiment is one of the enum values", () => {
    expect(["positive", "negative", "neutral"]).toContain(userReturn!.sentiment);
  });

  test("confidence is between 0 and 1 (inclusive)", () => {
    expect(userReturn!.confidence).toBeGreaterThanOrEqual(0);
    expect(userReturn!.confidence).toBeLessThanOrEqual(1);
  });

  test("for a clearly positive review the model returns sentiment: 'positive'", () => {
    // The input text is strongly positive; a correctly-wired schema + prompt
    // should land on "positive". This asserts the end-to-end behavior, not
    // just the mechanics.
    expect(userReturn!.sentiment).toBe("positive");
  });
});
