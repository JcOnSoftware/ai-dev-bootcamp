import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-tool-orchestration", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn:
    | {
        cartItems: Array<{
          success: boolean;
          cartItemId: string;
          productId: string;
          quantity: number;
        }>;
        totalSteps: number;
        finalSummary: string;
      }
    | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as typeof userReturn;
  });

  test("makes at least 3 API calls", () => {
    expect(calls.length).toBeGreaterThanOrEqual(3);
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

  test("userReturn cartItems is an array with at least 1 item", () => {
    expect(userReturn).toBeDefined();
    expect(Array.isArray(userReturn?.cartItems)).toBe(true);
    expect((userReturn?.cartItems ?? []).length).toBeGreaterThanOrEqual(1);
  });

  test("userReturn totalSteps is >= 2", () => {
    expect(typeof userReturn?.totalSteps).toBe("number");
    expect((userReturn?.totalSteps ?? 0)).toBeGreaterThanOrEqual(2);
  });

  test("userReturn finalSummary is a non-empty string", () => {
    expect(typeof userReturn?.finalSummary).toBe("string");
    expect((userReturn?.finalSummary ?? "").length).toBeGreaterThan(0);
  });

  test("last call has finish_reason 'stop'", () => {
    expect(lastCall?.response.choices[0]?.finish_reason).toBe("stop");
  });
});
