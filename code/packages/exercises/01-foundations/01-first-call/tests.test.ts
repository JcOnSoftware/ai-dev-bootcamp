import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-first-call", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — the exercise hits the real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  });

  test("makes exactly one API call", () => {
    expect(result.calls).toHaveLength(1);
  });

  test("uses a Claude model (Haiku preferred)", () => {
    const model = result.lastCall?.request.model ?? "";
    expect(model).toMatch(/^claude-/);
    if (!model.includes("haiku")) {
      console.warn(
        `[hint] You used '${model}'. Haiku is cheaper/faster for this exercise — try a haiku variant next time.`,
      );
    }
  });

  test("passes a reasonable max_tokens (1..500)", () => {
    const maxTokens = result.lastCall?.request.max_tokens;
    expect(typeof maxTokens).toBe("number");
    expect(maxTokens).toBeGreaterThan(0);
    expect(maxTokens).toBeLessThanOrEqual(500);
  });

  test("sends one user message with non-empty content", () => {
    const messages = result.lastCall?.request.messages ?? [];
    expect(messages).toHaveLength(1);
    const first = messages[0];
    expect(first?.role).toBe("user");
    const content = first?.content;
    const asString = typeof content === "string" ? content : JSON.stringify(content ?? "");
    expect(asString.length).toBeGreaterThan(0);
  });

  test("receives a response with at least one text block", () => {
    const response = result.lastCall?.response;
    expect(response).toBeDefined();
    const textBlock = response?.content.find((block) => block.type === "text");
    expect(textBlock).toBeDefined();
    if (textBlock?.type === "text") {
      expect(textBlock.text.length).toBeGreaterThan(0);
    }
  });

  test("reports token usage", () => {
    const usage = result.lastCall?.response.usage;
    expect(usage?.input_tokens).toBeGreaterThan(0);
    expect(usage?.output_tokens).toBeGreaterThan(0);
  });
});
