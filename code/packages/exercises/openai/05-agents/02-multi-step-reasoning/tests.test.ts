import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-multi-step-reasoning", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { totalCalls: number; finalAnswer: string } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { totalCalls: number; finalAnswer: string } | undefined;
  });

  test("makes at least 3 API calls (multi-step reasoning requires multiple tool rounds)", () => {
    expect(calls.length).toBeGreaterThanOrEqual(3);
  });

  test("userReturn totalCalls is >= 3", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn?.totalCalls).toBe("number");
    expect((userReturn?.totalCalls ?? 0)).toBeGreaterThanOrEqual(3);
  });

  test("userReturn finalAnswer is a non-empty string", () => {
    expect(typeof userReturn?.finalAnswer).toBe("string");
    expect((userReturn?.finalAnswer ?? "").length).toBeGreaterThan(0);
  });

  test("at least 2 different tool names were used across all calls", () => {
    const toolNames = new Set<string>();
    for (const call of calls) {
      const toolCalls = call.response.choices[0]?.message.tool_calls ?? [];
      for (const tc of toolCalls) {
        toolNames.add(tc.function.name);
      }
    }
    expect(toolNames.size).toBeGreaterThanOrEqual(2);
  });

  test("last call has finish_reason 'stop'", () => {
    expect(lastCall?.response.choices[0]?.finish_reason).toBe("stop");
  });
});
