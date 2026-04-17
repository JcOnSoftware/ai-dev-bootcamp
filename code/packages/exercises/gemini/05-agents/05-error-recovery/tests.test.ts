import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface RecoveryResult {
  lookupCallCount: number;
  toolCalls: string[];
  answer: string;
}

describe("05-error-recovery", () => {
  let calls: CapturedCallGemini[];
  let userReturn: RecoveryResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as RecoveryResult | undefined;
  }, 90_000);

  test("makes at least 3 generateContent calls (first → retry → final answer)", () => {
    const gen = calls.filter((c) => c.method === "generateContent");
    expect(gen.length).toBeGreaterThanOrEqual(3);
  });

  test("the lookup tool was called at least twice (original + retry)", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn!.lookupCallCount).toBeGreaterThanOrEqual(2);
  });

  test("all tool calls were `lookup`", () => {
    expect(userReturn!.toolCalls.length).toBeGreaterThanOrEqual(2);
    expect(userReturn!.toolCalls.every((n) => n === "lookup")).toBe(true);
  });

  test("one of the functionResponse parts contained an 'error' field (turn 1 failure)", () => {
    // Inspect the contents of turn 2's request — it should include the
    // functionResponse from turn 1 that carried the error.
    const turn2 = calls[1]!;
    const contents = turn2.request["contents"] as Array<{
      role?: string;
      parts?: Array<Record<string, unknown>>;
    }>;
    const hasError = (contents ?? [])
      .flatMap((m) => m.parts ?? [])
      .some((p) => {
        const fr = p["functionResponse"] as { response?: Record<string, unknown> } | undefined;
        return fr?.response?.["error"] === "timeout";
      });
    expect(hasError).toBe(true);
  });

  test("final answer acknowledges success (mentions data, retry, or the key)", () => {
    const ans = userReturn!.answer.toLowerCase();
    // The model either: (a) says the data was retrieved, (b) acknowledges the
    // retry was necessary, or (c) mentions the key. Any of those proves the
    // agent made sense of the error → retry → success trajectory.
    expect(/data|retriev|retry|success|user[_ ]profile/.test(ans)).toBe(true);
  });
});
