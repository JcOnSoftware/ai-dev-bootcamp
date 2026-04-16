import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-tool-calls-loop", () => {
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
  });

  test("makes exactly two API calls", () => {
    expect(calls).toHaveLength(2);
  });

  test("first call response has finish_reason 'tool_calls'", () => {
    expect(calls[0]?.response.choices[0]?.finish_reason).toBe("tool_calls");
  });

  test("second call messages include a 'tool' role message", () => {
    const messages = calls[1]?.request.messages ?? [];
    const toolMessage = messages.find((m) => m.role === "tool");
    expect(toolMessage).toBeDefined();
  });

  test("tool message has a tool_call_id", () => {
    const messages = calls[1]?.request.messages ?? [];
    const toolMessage = messages.find((m) => m.role === "tool") as
      | { role: "tool"; tool_call_id?: string; content: string }
      | undefined;
    expect(typeof toolMessage?.tool_call_id).toBe("string");
    expect((toolMessage?.tool_call_id ?? "").length).toBeGreaterThan(0);
  });

  test("tool message content is valid JSON with temperature and condition", () => {
    const messages = calls[1]?.request.messages ?? [];
    const toolMessage = messages.find((m) => m.role === "tool") as
      | { role: "tool"; content: string }
      | undefined;
    expect(toolMessage).toBeDefined();
    const parsed = JSON.parse(toolMessage!.content) as Record<string, unknown>;
    expect(typeof parsed["temperature"]).toBe("number");
    expect(typeof parsed["condition"]).toBe("string");
  });

  test("final response has finish_reason 'stop'", () => {
    expect(lastCall?.response.choices[0]?.finish_reason).toBe("stop");
  });

  test("final response has text content", () => {
    const content = lastCall?.response.choices[0]?.message.content;
    expect(typeof content).toBe("string");
    expect((content ?? "").length).toBeGreaterThan(0);
  });
});
