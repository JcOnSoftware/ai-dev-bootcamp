import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// Same rates the exercise documents (Haiku 4.5, as of 2026-04).
const INPUT_USD_PER_MTOK = 1;
const OUTPUT_USD_PER_MTOK = 5;

describe("04-tokens-cost", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — the exercise hits the real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 60_000);

  test("makes exactly one API call", () => {
    expect(result.calls).toHaveLength(1);
  });

  test("uses a Claude Haiku model", () => {
    const model = result.lastCall?.request.model ?? "";
    expect(model).toMatch(/^claude-/);
    expect(model).toContain("haiku");
  });

  test("passes max_tokens in the 1..500 range", () => {
    const maxTokens = (result.lastCall?.request as { max_tokens?: number }).max_tokens;
    expect(typeof maxTokens).toBe("number");
    expect(maxTokens).toBeGreaterThan(0);
    expect(maxTokens).toBeLessThanOrEqual(500);
  });

  test("response reports non-zero token usage", () => {
    const usage = result.lastCall?.response.usage;
    expect(usage?.input_tokens).toBeGreaterThan(0);
    expect(usage?.output_tokens).toBeGreaterThan(0);
  });

  test("user returned a positive numeric costUsd", () => {
    const userReturn = result.userReturn as { costUsd?: unknown } | undefined;
    expect(typeof userReturn?.costUsd).toBe("number");
    expect(userReturn?.costUsd as number).toBeGreaterThan(0);
  });

  test("costUsd matches the formula applied to the real response tokens", () => {
    const usage = result.lastCall?.response.usage;
    const expected =
      ((usage?.input_tokens ?? 0) / 1_000_000) * INPUT_USD_PER_MTOK +
      ((usage?.output_tokens ?? 0) / 1_000_000) * OUTPUT_USD_PER_MTOK;
    const userReturn = result.userReturn as { costUsd: number };
    // Allow tiny floating-point drift; tolerance well below a sane cent.
    expect(userReturn.costUsd).toBeCloseTo(expected, 10);
  });
});
