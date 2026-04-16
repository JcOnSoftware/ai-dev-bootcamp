import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-context-window-limits", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { response: unknown; finishReason: string | null; wasTruncated: boolean } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { response: unknown; finishReason: string | null; wasTruncated: boolean } | undefined;
  });

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("uses gpt-4.1-nano", () => {
    expect(lastCall?.request.model).toBe("gpt-4.1-nano");
  });

  test("sets max_completion_tokens to 50", () => {
    expect(lastCall?.request.max_completion_tokens).toBe(50);
  });

  test("finish_reason is 'length' (response was truncated)", () => {
    expect(userReturn?.finishReason).toBe("length");
  });

  test("wasTruncated is true", () => {
    expect(userReturn?.wasTruncated).toBe(true);
  });

  test("completion_tokens is at most 50", () => {
    const usage = lastCall?.response.usage;
    expect(usage?.completion_tokens).toBeLessThanOrEqual(50);
  });
});
