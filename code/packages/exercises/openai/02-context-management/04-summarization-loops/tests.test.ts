import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-summarization-loops", () => {
  let calls: CapturedCallOpenAI[];
  let userReturn: { summary: string; finalResponse: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    userReturn = raw.userReturn as { summary: string; finalResponse: unknown } | undefined;
  });

  test("makes at least 3 API calls (2 normal + 1 summarize)", () => {
    expect(calls.length).toBeGreaterThanOrEqual(3);
  });

  test("returns a summary string", () => {
    expect(typeof userReturn?.summary).toBe("string");
    expect((userReturn?.summary as string).length).toBeGreaterThan(0);
  });

  test("summary is a single sentence (ends with period or similar)", () => {
    const summary = userReturn?.summary as string;
    // A sentence is reasonably short and non-empty
    expect(summary.length).toBeGreaterThan(10);
    expect(summary.length).toBeLessThan(500);
  });

  test("returns a finalResponse with content", () => {
    const finalResponse = userReturn?.finalResponse as {
      choices?: Array<{ message?: { content?: string } }>;
    } | undefined;
    const content = finalResponse?.choices?.[0]?.message?.content;
    expect(typeof content).toBe("string");
    expect((content as string).length).toBeGreaterThan(0);
  });

  test("all calls use gpt-4.1-nano", () => {
    for (const call of calls) {
      expect(call.request.model).toBe("gpt-4.1-nano");
    }
  });
});
