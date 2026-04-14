import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-params", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — the exercise hits the real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  });

  test("makes exactly two API calls", () => {
    expect(result.calls).toHaveLength(2);
  });

  test("at least one call is deterministic (temperature === 0)", () => {
    const deterministic = result.calls.find(
      (c) => (c.request as { temperature?: number }).temperature === 0,
    );
    expect(deterministic).toBeDefined();
  });

  test("at least one call is creative (temperature >= 0.7)", () => {
    const creative = result.calls.find((c) => {
      const t = (c.request as { temperature?: number }).temperature;
      return typeof t === "number" && t >= 0.7;
    });
    expect(creative).toBeDefined();
  });

  test("both calls use a Claude Haiku model", () => {
    for (const call of result.calls) {
      const model = (call.request as { model: string }).model;
      expect(model).toMatch(/^claude-/);
      if (!model.includes("haiku")) {
        console.warn(
          `[hint] Call used '${model}'. Haiku is the cheap/fast default for learning.`,
        );
      }
    }
  });

  test("both calls pass max_tokens in the 1..500 range", () => {
    for (const call of result.calls) {
      const maxTokens = (call.request as { max_tokens?: number }).max_tokens;
      expect(typeof maxTokens).toBe("number");
      expect(maxTokens).toBeGreaterThan(0);
      expect(maxTokens).toBeLessThanOrEqual(500);
    }
  });

  test("each call has a user message with non-empty content", () => {
    for (const call of result.calls) {
      const messages = (call.request as { messages: { role: string; content: unknown }[] })
        .messages;
      expect(messages.length).toBeGreaterThan(0);
      const first = messages[0];
      expect(first?.role).toBe("user");
      const asString =
        typeof first?.content === "string" ? first.content : JSON.stringify(first?.content ?? "");
      expect(asString.length).toBeGreaterThan(0);
    }
  });

  test("both responses include at least one text block", () => {
    for (const call of result.calls) {
      const textBlock = call.response.content.find((block) => block.type === "text");
      expect(textBlock).toBeDefined();
      if (textBlock?.type === "text") {
        expect(textBlock.text.length).toBeGreaterThan(0);
      }
    }
  });

  test("both responses report token usage", () => {
    for (const call of result.calls) {
      expect(call.response.usage.input_tokens).toBeGreaterThan(0);
      expect(call.response.usage.output_tokens).toBeGreaterThan(0);
    }
  });
});
