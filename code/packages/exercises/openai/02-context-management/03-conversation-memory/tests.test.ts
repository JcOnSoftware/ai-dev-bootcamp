import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-conversation-memory", () => {
  let calls: CapturedCallOpenAI[];
  let firstCall: CapturedCallOpenAI | undefined;
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { turns: number; finalResponse: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    firstCall = calls[0];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { turns: number; finalResponse: unknown } | undefined;
  });

  test("makes exactly 3 API calls (one per turn)", () => {
    expect(calls).toHaveLength(3);
  });

  test("first call has exactly 1 message", () => {
    expect(firstCall?.request.messages.length).toBe(1);
  });

  test("last call has at least 5 messages (full history)", () => {
    expect(lastCall?.request.messages.length).toBeGreaterThanOrEqual(5);
  });

  test("turns is 3", () => {
    expect(userReturn?.turns).toBe(3);
  });

  test("finalResponse has content", () => {
    const finalResponse = userReturn?.finalResponse as { choices?: Array<{ message?: { content?: string } }> } | undefined;
    const content = finalResponse?.choices?.[0]?.message?.content;
    expect(typeof content).toBe("string");
    expect((content as string).length).toBeGreaterThan(0);
  });

  test("each subsequent call includes more messages than the previous", () => {
    const counts = calls.map((c) => c.request.messages.length);
    expect(counts[1]!).toBeGreaterThan(counts[0]!);
    expect(counts[2]!).toBeGreaterThan(counts[1]!);
  });
});
