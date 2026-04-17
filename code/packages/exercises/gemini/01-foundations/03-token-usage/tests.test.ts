import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface UsageReport {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

describe("03-token-usage", () => {
  let calls: CapturedCallGemini[];
  let userReturn: UsageReport | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as UsageReport | undefined;
  }, 30_000);

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("returns UsageReport with all four fields", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.inputTokens).toBe("number");
    expect(typeof userReturn!.outputTokens).toBe("number");
    expect(typeof userReturn!.totalTokens).toBe("number");
    expect(typeof userReturn!.estimatedCostUSD).toBe("number");
  });

  test("inputTokens and outputTokens are positive", () => {
    expect(userReturn!.inputTokens).toBeGreaterThan(0);
    expect(userReturn!.outputTokens).toBeGreaterThan(0);
  });

  test("totalTokens roughly equals inputTokens + outputTokens", () => {
    // SDK may report a totalTokenCount that slightly exceeds input+output (e.g. thinking
    // tokens for 2.5-pro). For flash-lite they should match within a small tolerance.
    const sum = userReturn!.inputTokens + userReturn!.outputTokens;
    expect(userReturn!.totalTokens).toBeGreaterThanOrEqual(sum);
    expect(userReturn!.totalTokens - sum).toBeLessThanOrEqual(10);
  });

  test("estimatedCostUSD is a small positive number", () => {
    expect(userReturn!.estimatedCostUSD).toBeGreaterThan(0);
    // A single flash-lite call should cost far less than a cent.
    expect(userReturn!.estimatedCostUSD).toBeLessThan(0.01);
  });

  test("estimatedCostUSD uses flash-lite rates (0.10 in / 0.40 out per 1M)", () => {
    const expected =
      (userReturn!.inputTokens / 1_000_000) * 0.10 +
      (userReturn!.outputTokens / 1_000_000) * 0.40;
    // Allow tiny floating-point tolerance.
    expect(Math.abs(userReturn!.estimatedCostUSD - expected)).toBeLessThan(1e-9);
  });
});
