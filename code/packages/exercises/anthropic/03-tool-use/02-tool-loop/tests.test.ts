import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-tool-loop", () => {
  let result: HarnessResult;

  // ── Unit tests: executeGetWeather (no API) ────────────────────────────────
  test("executeGetWeather returns a JSON string", async () => {
    const mod = (await import(`${EXERCISE_FILE}?t=${Date.now()}`)) as {
      executeGetWeather: (input: { location: string; unit?: string }) => string;
    };
    const output = mod.executeGetWeather({ location: "Paris, FR" });
    expect(typeof output).toBe("string");
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toBeDefined();
    expect(typeof parsed["temperature"]).toBe("number");
  });

  // ── Integration tests ─────────────────────────────────────────────────────
  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 45_000);

  test("calls.length is 2", () => {
    expect(result.calls).toHaveLength(2);
  });

  test("call 1 response contains a tool_use block", () => {
    const toolUseBlock = result.calls[0]!.response.content.find(
      (b) => b.type === "tool_use",
    );
    expect(toolUseBlock).toBeDefined();
  });

  test("call 2 request last user message contains tool_result with matching tool_use_id", () => {
    const call1ToolUse = result.calls[0]!.response.content.find(
      (b) => b.type === "tool_use",
    ) as { type: string; id: string } | undefined;
    expect(call1ToolUse).toBeDefined();

    const messages = result.calls[1]!.request.messages;
    const lastMessage = messages[messages.length - 1]!;
    expect(lastMessage.role).toBe("user");

    const content = Array.isArray(lastMessage.content) ? lastMessage.content : [];
    const toolResultBlock = content.find(
      (b) => (b as { type?: string }).type === "tool_result",
    ) as { type: string; tool_use_id: string } | undefined;
    expect(toolResultBlock).toBeDefined();
    expect(toolResultBlock!.tool_use_id).toBe(call1ToolUse!.id);
  });

  test("call 2 response stop_reason is end_turn", () => {
    expect(result.calls[1]!.response.stop_reason).toBe("end_turn");
  });

  test("model is haiku", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });
});
