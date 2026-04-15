import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-parallel-tools", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 60_000);

  test("calls.length is 2", () => {
    expect(result.calls).toHaveLength(2);
  });

  test("call 1 returns >= 1 tool_use block", () => {
    const toolUseBlocks = result.calls[0]!.response.content.filter(
      (b) => b.type === "tool_use",
    );
    expect(toolUseBlocks.length).toBeGreaterThanOrEqual(1);
  });

  test("call 2 user message contains one tool_result per tool_use from call 1", () => {
    // Extract tool_use blocks from call 1
    const toolUseBlocks = result.calls[0]!.response.content.filter(
      (b) => b.type === "tool_use",
    ) as { type: string; id: string }[];

    const messages = result.calls[1]!.request.messages;
    const lastMessage = messages[messages.length - 1]!;
    expect(lastMessage.role).toBe("user");

    const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];
    const toolResultBlocks = content.filter(
      (b) => (b as { type?: string }).type === "tool_result",
    ) as { type: string; tool_use_id: string }[];

    // Number of tool_results must match number of tool_use blocks
    expect(toolResultBlocks.length).toBe(toolUseBlocks.length);

    // Every tool_use_id must be present in tool_result blocks
    const resultIds = new Set(toolResultBlocks.map((b) => b.tool_use_id));
    for (const tu of toolUseBlocks) {
      expect(resultIds.has(tu.id)).toBe(true);
    }
  });

  test("call 2 response stop_reason is end_turn", () => {
    expect(result.calls[1]!.response.stop_reason).toBe("end_turn");
  });

  test("model is haiku", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });
});
