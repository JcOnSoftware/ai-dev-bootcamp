import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-parallel-tool-execution", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { toolCallCount: number; response: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { toolCallCount: number; response: unknown } | undefined;
  });

  test("makes at least two API calls", () => {
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  test("first call requests parallel_tool_calls or has multiple tool_calls in response", () => {
    // Either parallel_tool_calls is set in request OR model returns multiple tool_calls
    const firstCallToolCalls = calls[0]?.response.choices[0]?.message.tool_calls ?? [];
    expect(firstCallToolCalls.length).toBeGreaterThanOrEqual(2);
  });

  test("second call messages contain multiple 'tool' role messages", () => {
    const messages = calls[1]?.request.messages ?? [];
    const toolMessages = messages.filter((m) => m.role === "tool");
    expect(toolMessages.length).toBeGreaterThanOrEqual(2);
  });

  test("userReturn has toolCallCount >= 2", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn?.toolCallCount).toBe("number");
    expect((userReturn?.toolCallCount ?? 0)).toBeGreaterThanOrEqual(2);
  });

  test("final response has text content", () => {
    const content = lastCall?.response.choices[0]?.message.content;
    expect(typeof content).toBe("string");
    expect((content ?? "").length).toBeGreaterThan(0);
  });

  test("final response finish_reason is 'stop'", () => {
    expect(lastCall?.response.choices[0]?.finish_reason).toBe("stop");
  });
});
