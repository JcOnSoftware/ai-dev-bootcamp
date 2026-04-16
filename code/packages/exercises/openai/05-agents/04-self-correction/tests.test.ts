import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-self-correction", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn:
    | { results: Array<{ result?: number; error?: string }>; hadError: boolean }
    | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as
      | { results: Array<{ result?: number; error?: string }>; hadError: boolean }
      | undefined;
  });

  test("makes at least 2 API calls", () => {
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  test("userReturn hadError is true", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn?.hadError).toBe(true);
  });

  test("userReturn results is defined", () => {
    expect(userReturn?.results).toBeDefined();
    expect(Array.isArray(userReturn?.results)).toBe(true);
  });

  test("final response mentions error or zero or cannot (case-insensitive)", () => {
    const content = lastCall?.response.choices[0]?.message.content ?? "";
    expect(content.toLowerCase()).toMatch(/error|zero|cannot|can't|undefined|division/);
  });

  test("last call has finish_reason 'stop'", () => {
    expect(lastCall?.response.choices[0]?.finish_reason).toBe("stop");
  });
});
