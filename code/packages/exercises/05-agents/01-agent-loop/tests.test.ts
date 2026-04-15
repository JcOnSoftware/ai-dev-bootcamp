import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-agent-loop", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("at least one API call was made", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(1);
  });

  test("call count is between 1 and 10 (bounded loop)", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(1);
    expect(result.calls.length).toBeLessThanOrEqual(10);
  });

  test("first call includes search_docs and read_chunk tools", () => {
    const toolNames = result.calls[0]!.request.tools?.map((t) => t.name) ?? [];
    expect(toolNames).toContain("search_docs");
    expect(toolNames).toContain("read_chunk");
  });

  test("model is haiku", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });

  test("final call stop_reason is end_turn", () => {
    const lastCall = result.calls[result.calls.length - 1]!;
    expect(lastCall.response.stop_reason).toBe("end_turn");
  });

  test("final response contains a text block", () => {
    const lastCall = result.calls[result.calls.length - 1]!;
    const textBlock = lastCall.response.content.find((b) => b.type === "text");
    expect(textBlock).toBeDefined();
    expect((textBlock as { type: string; text: string }).text.length).toBeGreaterThan(0);
  });

  test("at least one intermediate call used a tool (tool_use stop_reason)", () => {
    const toolCallExists = result.calls.some((c) => c.response.stop_reason === "tool_use");
    expect(toolCallExists).toBe(true);
  });
});
