import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-citations-grounding", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { answer: string; citations: string[] } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { answer: string; citations: string[] } | undefined;
  });

  test("makes at least 1 chat completion call", () => {
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  test("chat request includes a system message with citation instructions", () => {
    const messages = lastCall?.request.messages ?? [];
    const systemMsg = messages.find((m) => m.role === "system");
    expect(systemMsg).toBeDefined();
    const content = typeof systemMsg?.content === "string" ? systemMsg.content : "";
    // Should instruct the model to cite sources
    expect(content.toLowerCase()).toMatch(/cit|source/i);
  });

  test("userReturn has a non-empty answer", () => {
    expect(typeof userReturn?.answer).toBe("string");
    expect(userReturn!.answer.length).toBeGreaterThan(0);
  });

  test("userReturn has a citations array", () => {
    expect(Array.isArray(userReturn?.citations)).toBe(true);
  });

  test("answer contains at least one citation marker", () => {
    // Accept [Source N], [1], [N], or similar citation patterns
    expect(userReturn?.answer).toMatch(/\[Source \d+\]|\[\d+\]/);
  });

  test("citations array has at least one entry", () => {
    expect(userReturn!.citations.length).toBeGreaterThan(0);
  });

  test("citations reference real source numbers", () => {
    for (const citation of userReturn?.citations ?? []) {
      expect(citation).toMatch(/\[Source \d+\]/);
    }
  });
});
