import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-retrieval-pipeline", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { query: string; context: string[]; answer: string } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { query: string; context: string[]; answer: string } | undefined;
  }, 60_000);

  test("makes at least 1 chat completion call", () => {
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  test("chat request includes a system message", () => {
    const messages = lastCall?.request.messages ?? [];
    const systemMsg = messages.find((m) => m.role === "system");
    expect(systemMsg).toBeDefined();
  });

  test("chat request includes a user message with context", () => {
    const messages = lastCall?.request.messages ?? [];
    const userMsg = messages.find((m) => m.role === "user");
    expect(userMsg).toBeDefined();
    const content = typeof userMsg?.content === "string" ? userMsg.content : "";
    expect(content.length).toBeGreaterThan(0);
  });

  test("userReturn has query string", () => {
    expect(typeof userReturn?.query).toBe("string");
    expect(userReturn!.query.length).toBeGreaterThan(0);
  });

  test("userReturn has context array with at least 1 chunk", () => {
    expect(Array.isArray(userReturn?.context)).toBe(true);
    expect(userReturn!.context.length).toBeGreaterThan(0);
  });

  test("userReturn has non-empty answer", () => {
    expect(typeof userReturn?.answer).toBe("string");
    expect(userReturn!.answer.length).toBeGreaterThan(0);
  });

  test("answer mentions TypeScript (correct retrieval)", () => {
    expect(userReturn?.answer).toMatch(/TypeScript/i);
  });
});
