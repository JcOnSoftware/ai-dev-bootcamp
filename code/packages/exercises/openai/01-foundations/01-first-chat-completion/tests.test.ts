import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-first-chat-completion", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
  }, 60_000);

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("uses a GPT model (gpt-4.1-nano preferred)", () => {
    const model = lastCall?.request.model ?? "";
    expect(model).toMatch(/^gpt-/);
    if (!model.includes("nano")) {
      console.warn(
        `[hint] You used '${model}'. gpt-4.1-nano is cheapest for this exercise — try it next time.`,
      );
    }
  });

  test("passes a reasonable max_completion_tokens (1..500)", () => {
    const maxTokens = lastCall?.request.max_completion_tokens;
    expect(typeof maxTokens).toBe("number");
    expect(maxTokens).toBeGreaterThan(0);
    expect(maxTokens).toBeLessThanOrEqual(500);
  });

  test("sends one user message with non-empty content", () => {
    const messages = lastCall?.request.messages ?? [];
    expect(messages).toHaveLength(1);
    const first = messages[0];
    expect(first?.role).toBe("user");
    const content = typeof first?.content === "string" ? first.content : JSON.stringify(first?.content ?? "");
    expect(content.length).toBeGreaterThan(0);
  });

  test("receives a response with content in choices", () => {
    const response = lastCall?.response;
    expect(response).toBeDefined();
    expect(response?.choices).toBeDefined();
    expect(response!.choices.length).toBeGreaterThan(0);
    const content = response!.choices[0]?.message?.content;
    expect(content).toBeDefined();
    expect(content!.length).toBeGreaterThan(0);
  });

  test("reports token usage", () => {
    const usage = lastCall?.response.usage;
    expect(usage?.prompt_tokens).toBeGreaterThan(0);
    expect(usage?.completion_tokens).toBeGreaterThan(0);
  });
});
