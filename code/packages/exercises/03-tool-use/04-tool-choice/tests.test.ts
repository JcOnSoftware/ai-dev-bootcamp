import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-tool-choice", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 60_000);

  test("calls.length is 4", () => {
    expect(result.calls).toHaveLength(4);
  });

  test("calls[0] tool_choice is auto (or omitted — default is auto)", () => {
    const toolChoice = result.calls[0]!.request.tool_choice as
      | { type: string }
      | undefined;
    // auto is the default; SDK may omit it or include { type: "auto" }
    expect(toolChoice === undefined || toolChoice?.type === "auto").toBe(true);
  });

  test("calls[1] tool_choice is { type: 'any' }", () => {
    const toolChoice = result.calls[1]!.request.tool_choice as { type: string } | undefined;
    expect(toolChoice?.type).toBe("any");
  });

  test("calls[2] tool_choice is { type: 'tool', name: 'calculate' }", () => {
    const toolChoice = result.calls[2]!.request.tool_choice as
      | { type: string; name?: string }
      | undefined;
    expect(toolChoice).toEqual({ type: "tool", name: "calculate" });
  });

  test("calls[2] response contains tool_use block with name calculate", () => {
    const toolUseBlock = result.calls[2]!.response.content.find(
      (b) => b.type === "tool_use",
    ) as { type: string; name: string } | undefined;
    expect(toolUseBlock).toBeDefined();
    expect(toolUseBlock!.name).toBe("calculate");
  });

  test("calls[3] tool_choice is { type: 'none' } and response has no tool_use block", () => {
    const toolChoice = result.calls[3]!.request.tool_choice as { type: string } | undefined;
    expect(toolChoice?.type).toBe("none");
    const toolUseBlock = result.calls[3]!.response.content.find(
      (b) => b.type === "tool_use",
    );
    expect(toolUseBlock).toBeUndefined();
  });

  test("model is haiku", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });
});
