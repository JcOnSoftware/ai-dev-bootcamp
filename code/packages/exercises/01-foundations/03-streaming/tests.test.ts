import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("03-streaming", () => {
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

  test("the call uses streaming (stream: true on request)", () => {
    const call = result.lastCall;
    expect(call).toBeDefined();
    expect((call?.request as { stream?: boolean }).stream).toBe(true);
  });

  test("the call was captured as streamed by the harness", () => {
    expect(result.lastCall?.streamed).toBe(true);
  });

  test("uses a Claude Haiku model", () => {
    const model = result.lastCall?.request.model ?? "";
    expect(model).toMatch(/^claude-/);
    if (!model.includes("haiku")) {
      console.warn(`[hint] Used '${model}'. Haiku is the cheap/fast default for learning.`);
    }
  });

  test("passes a reasonable max_tokens (1..500)", () => {
    const maxTokens = (result.lastCall?.request as { max_tokens?: number }).max_tokens;
    expect(typeof maxTokens).toBe("number");
    expect(maxTokens).toBeGreaterThan(0);
    expect(maxTokens).toBeLessThanOrEqual(500);
  });

  test("user returned an accumulatedText that is a non-empty string", () => {
    const userReturn = result.userReturn as { accumulatedText?: unknown } | undefined;
    expect(typeof userReturn?.accumulatedText).toBe("string");
    expect((userReturn?.accumulatedText as string).length).toBeGreaterThan(0);
  });

  test("accumulatedText matches the finalMessage text", () => {
    const userReturn = result.userReturn as {
      accumulatedText?: string;
      finalMessage?: { content: { type: string; text?: string }[] };
    };
    const finalText = userReturn.finalMessage?.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    expect(userReturn.accumulatedText).toBe(finalText);
  });

  test("the captured finalMessage has at least one text block", () => {
    const response = result.lastCall?.response;
    expect(response).toBeDefined();
    const textBlock = response?.content.find((b) => b.type === "text");
    expect(textBlock).toBeDefined();
  });

  test("response reports token usage", () => {
    const usage = result.lastCall?.response.usage;
    expect(usage?.input_tokens).toBeGreaterThan(0);
    expect(usage?.output_tokens).toBeGreaterThan(0);
  });
});
