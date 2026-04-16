import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-tool-choice-control", () => {
  let calls: CapturedCallOpenAI[];
  let userReturn: { autoResult: unknown; requiredResult: unknown; noneResult: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    userReturn = raw.userReturn as
      | { autoResult: unknown; requiredResult: unknown; noneResult: unknown }
      | undefined;
  });

  test("makes exactly three API calls", () => {
    expect(calls).toHaveLength(3);
  });

  test("first call has tool_choice 'auto' (or undefined)", () => {
    const tc = calls[0]?.request.tool_choice;
    expect(tc === "auto" || tc === undefined).toBe(true);
  });

  test("second call has tool_choice 'required'", () => {
    expect(calls[1]?.request.tool_choice).toBe("required");
  });

  test("third call has tool_choice 'none'", () => {
    expect(calls[2]?.request.tool_choice).toBe("none");
  });

  test("required call has finish_reason 'tool_calls'", () => {
    expect(calls[1]?.response.choices[0]?.finish_reason).toBe("tool_calls");
  });

  test("none call has finish_reason 'stop'", () => {
    expect(calls[2]?.response.choices[0]?.finish_reason).toBe("stop");
  });

  test("none call response has no tool_calls", () => {
    const toolCalls = calls[2]?.response.choices[0]?.message.tool_calls;
    expect(toolCalls === undefined || toolCalls === null || (Array.isArray(toolCalls) && toolCalls.length === 0)).toBe(true);
  });

  test("userReturn has autoResult, requiredResult, and noneResult", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn).toHaveProperty("autoResult");
    expect(userReturn).toHaveProperty("requiredResult");
    expect(userReturn).toHaveProperty("noneResult");
  });
});
