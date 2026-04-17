import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-state-management", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { notes: string[]; turnCount: number } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { notes: string[]; turnCount: number } | undefined;
  }, 60_000);

  test("makes at least 3 API calls", () => {
    expect(calls.length).toBeGreaterThanOrEqual(3);
  });

  test("userReturn notes is an array with at least 2 entries", () => {
    expect(userReturn).toBeDefined();
    expect(Array.isArray(userReturn?.notes)).toBe(true);
    expect((userReturn?.notes ?? []).length).toBeGreaterThanOrEqual(2);
  });

  test("userReturn turnCount is >= 2", () => {
    expect(typeof userReturn?.turnCount).toBe("number");
    expect((userReturn?.turnCount ?? 0)).toBeGreaterThanOrEqual(2);
  });

  test("last call finishes cleanly (finish_reason is 'stop' or 'length')", () => {
    // 'stop' is the happy path (model terminated naturally).
    // 'length' means max_completion_tokens cap was hit — still valid
    // behavior: the conversation reached the model's output budget rather
    // than running forever. Either signals the agent loop terminated.
    // What MUST NOT happen: 'tool_calls' on the FINAL call (would mean
    // the loop exited with unresolved tools) or 'content_filter'.
    const finishReason = lastCall?.response.choices[0]?.finish_reason ?? "";
    expect(["stop", "length"]).toContain(finishReason);
    if (finishReason === "length") {
      console.warn(
        "[hint] last call hit 'length' cap — consider bumping max_completion_tokens.",
      );
    }
  });
});
