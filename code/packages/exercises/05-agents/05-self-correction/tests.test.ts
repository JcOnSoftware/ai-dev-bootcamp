import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-self-correction", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("at least 2 API calls were made", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(2);
  });

  test("call count is between 2 and 10", () => {
    expect(result.calls.length).toBeGreaterThanOrEqual(2);
    expect(result.calls.length).toBeLessThanOrEqual(10);
  });

  test("model is haiku", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });

  test("system prompt instructs Claude to try different approach on error", () => {
    const systemPrompt = result.calls[0]!.request.system;
    expect(typeof systemPrompt).toBe("string");
    const lower = (systemPrompt as string).toLowerCase();
    const hasErrorInstruction =
      lower.includes("error") &&
      (lower.includes("different") || lower.includes("another") || lower.includes("try"));
    expect(hasErrorInstruction).toBe(true);
  });

  test("at least one tool_result message contains an error (retries happened)", () => {
    // Count tool_result messages containing '{"error":' in the conversation
    let errorToolResultCount = 0;
    for (const call of result.calls) {
      for (const msg of call.request.messages) {
        if (msg.role === "user" && Array.isArray(msg.content)) {
          for (const block of msg.content) {
            const b = block as { type?: string; content?: string };
            if (
              b.type === "tool_result" &&
              typeof b.content === "string" &&
              b.content.includes('"error"')
            ) {
              errorToolResultCount++;
            }
          }
        }
      }
    }
    expect(errorToolResultCount).toBeGreaterThanOrEqual(1);
  });

  test("read_chunk was called at least twice with different ids (recovery after error)", () => {
    const readChunkIds = new Set<string>();
    for (const call of result.calls) {
      for (const block of call.response.content) {
        if (block.type === "tool_use" && block.name === "read_chunk") {
          const input = block.input as { id: string };
          readChunkIds.add(input.id);
        }
      }
    }
    expect(readChunkIds.size).toBeGreaterThanOrEqual(2);
  });

  test("final response is end_turn with a text block", () => {
    const lastCall = result.calls[result.calls.length - 1]!;
    expect(lastCall.response.stop_reason).toBe("end_turn");
    const textBlock = lastCall.response.content.find((b) => b.type === "text");
    expect(textBlock).toBeDefined();
    expect((textBlock as { type: string; text: string }).text.length).toBeGreaterThan(0);
  });
});
