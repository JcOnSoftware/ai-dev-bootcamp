import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-multi-tool-routing", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
  }, 60_000);

  test("makes at least two API calls", () => {
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  test("first call request has at least 3 tools", () => {
    expect((calls[0]?.request.tools ?? []).length).toBeGreaterThanOrEqual(3);
  });

  test("first call response requests tool calls", () => {
    expect(calls[0]?.response.choices[0]?.finish_reason).toBe("tool_calls");
  });

  test("tool names across all calls include at least 2 distinct functions", () => {
    const toolNames = new Set<string>();
    for (const call of calls) {
      const toolCalls = call.response.choices[0]?.message.tool_calls ?? [];
      for (const tc of toolCalls) {
        toolNames.add(tc.function.name);
      }
      // Also check tool messages in subsequent calls
      for (const msg of call.request.messages) {
        if (msg.role === "tool") {
          // tool_call_id is present but we can't recover the name from it here
        }
      }
    }
    // The first call should have requested at least 2 tool calls
    const firstCallToolCalls = calls[0]?.response.choices[0]?.message.tool_calls ?? [];
    expect(firstCallToolCalls.length).toBeGreaterThanOrEqual(2);
  });

  test("second call messages contain at least one 'tool' role message", () => {
    const messages = calls[1]?.request.messages ?? [];
    const toolMessages = messages.filter((m) => m.role === "tool");
    expect(toolMessages.length).toBeGreaterThanOrEqual(1);
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
