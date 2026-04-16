import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-basic-tool", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("calls.length is 1", () => {
    expect(result.calls).toHaveLength(1);
  });

  test("calls[0].request.tools has get_weather", () => {
    const tools = result.calls[0]!.request.tools as { name: string }[] | undefined;
    expect(Array.isArray(tools)).toBe(true);
    expect(tools!.length).toBe(1);
    expect(tools![0]!.name).toBe("get_weather");
  });

  test("stop_reason is tool_use", () => {
    expect(result.calls[0]!.response.stop_reason).toBe("tool_use");
  });

  test("response contains tool_use content block with name and input.location", () => {
    const toolUseBlock = result.calls[0]!.response.content.find(
      (b) => b.type === "tool_use",
    ) as { type: string; name: string; input: { location?: string } } | undefined;
    expect(toolUseBlock).toBeDefined();
    expect(toolUseBlock!.name).toBe("get_weather");
    expect(toolUseBlock!.input.location).toBeTruthy();
  });

  test("model is haiku", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });
});
