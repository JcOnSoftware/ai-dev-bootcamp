import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-truncation-strategies", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { originalCount: number; truncatedCount: number; response: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { originalCount: number; truncatedCount: number; response: unknown } | undefined;
  }, 60_000);

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("request has at most 7 messages (system + last 6)", () => {
    expect(lastCall?.request.messages.length).toBeLessThanOrEqual(7);
  });

  test("first message in request is the system message", () => {
    expect(lastCall?.request.messages[0]?.role).toBe("system");
  });

  test("response has content", () => {
    const content = lastCall?.response.choices[0]?.message.content;
    expect(typeof content).toBe("string");
    expect((content as string).length).toBeGreaterThan(0);
  });

  test("originalCount is greater than truncatedCount", () => {
    expect(userReturn?.originalCount).toBeGreaterThan(userReturn?.truncatedCount ?? 0);
  });

  test("truncatedCount matches the number of messages sent", () => {
    expect(userReturn?.truncatedCount).toBe(lastCall?.request.messages.length);
  });
});
