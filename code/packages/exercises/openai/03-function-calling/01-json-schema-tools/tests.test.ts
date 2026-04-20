import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-json-schema-tools", () => {
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

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("request includes a tools array with at least one tool", () => {
    expect(Array.isArray(lastCall?.request.tools)).toBe(true);
    expect((lastCall?.request.tools ?? []).length).toBeGreaterThanOrEqual(1);
  });

  test("first tool has type 'function'", () => {
    const tool = lastCall?.request.tools?.[0];
    expect(tool?.type).toBe("function");
  });

  test("first tool function name is 'get_weather'", () => {
    const tool = lastCall?.request.tools?.[0];
    expect(tool?.function?.name).toBe("get_weather");
  });

  test("get_weather tool has a parameters object", () => {
    const tool = lastCall?.request.tools?.[0];
    expect(typeof tool?.function?.parameters).toBe("object");
    expect(tool?.function?.parameters).not.toBeNull();
  });

  test("response finish_reason is 'tool_calls'", () => {
    expect(lastCall?.response.choices[0]?.finish_reason).toBe("tool_calls");
  });

  test("response has tool_calls with at least one entry", () => {
    const toolCalls = lastCall?.response.choices[0]?.message.tool_calls;
    expect(Array.isArray(toolCalls)).toBe(true);
    expect((toolCalls ?? []).length).toBeGreaterThanOrEqual(1);
  });

  test("tool call references the get_weather function", () => {
    const toolCall = lastCall?.response.choices[0]?.message.tool_calls?.[0];
    expect(toolCall?.function?.name).toBe("get_weather");
  });
});
