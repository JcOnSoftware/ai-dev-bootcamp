import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-state-management", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("at least 2 API calls were made (2-turn conversation)", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(2);
  });

  test("total call count is between 2 and 15", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(2);
    expect(result.calls.length).toBeLessThanOrEqual(15);
  });

  test("model is haiku", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });

  test("turn 2 request includes messages from turn 1 (conversation history)", () => {
    // The second distinct user question should result in API calls
    // that include prior context (messages array length > 1)
    const secondTurnCalls = result.calls.filter((c) => c.request.messages.length > 1);
    expect(secondTurnCalls.length).toBeGreaterThanOrEqual(1);
  });

  test("total messages accumulate: last call has at least 4 messages", () => {
    const lastCall = result.calls[result.calls.length - 1]!;
    expect(lastCall.request.messages.length).toBeGreaterThanOrEqual(4);
  });

  test("final response is end_turn", () => {
    const lastCall = result.calls[result.calls.length - 1]!;
    expect(lastCall.response.stop_reason).toBe("end_turn");
  });

  test("final response contains a text block", () => {
    const lastCall = result.calls[result.calls.length - 1]!;
    const textBlock = lastCall.response.content.find((b) => b.type === "text");
    expect(textBlock).toBeDefined();
    expect((textBlock as { type: string; text: string }).text.length).toBeGreaterThan(0);
  });
});
