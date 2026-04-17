import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface CallCost {
  cachedTokens: number;
  freshInputTokens: number;
  outputTokens: number;
  costWithCacheUSD: number;
  costWithoutCacheUSD: number;
}

interface SavingsReport {
  calls: CallCost[];
  totalWithCacheUSD: number;
  totalWithoutCacheUSD: number;
  savingsUSD: number;
  savingsPercent: number;
}

describe("05-cache-cost-savings", () => {
  let calls: CapturedCallGemini[];
  let userReturn: SavingsReport | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as SavingsReport | undefined;
  }, 90_000);

  test("makes exactly three generateContent calls against the cache", () => {
    const generate = calls.filter((c) => c.method === "generateContent");
    expect(generate).toHaveLength(3);
  });

  test("every generateContent call references a cache via config.cachedContent", () => {
    for (const call of calls) {
      const config = call.request["config"] as Record<string, unknown> | undefined;
      expect(config?.["cachedContent"]).toMatch(/^cachedContents\//);
    }
  });

  test("returns 3 per-call cost breakdowns", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn!.calls).toHaveLength(3);
  });

  test("every call has cachedTokens > 0 (cache was actually used)", () => {
    for (const c of userReturn!.calls) {
      expect(c.cachedTokens).toBeGreaterThan(0);
    }
  });

  test("every call has costWithCacheUSD < costWithoutCacheUSD", () => {
    for (const c of userReturn!.calls) {
      expect(c.costWithCacheUSD).toBeLessThan(c.costWithoutCacheUSD);
    }
  });

  test("totals sum correctly across the 3 calls", () => {
    const sumWith = userReturn!.calls.reduce((a, c) => a + c.costWithCacheUSD, 0);
    const sumWithout = userReturn!.calls.reduce((a, c) => a + c.costWithoutCacheUSD, 0);
    // Floating-point tolerance for the summation.
    expect(Math.abs(userReturn!.totalWithCacheUSD - sumWith)).toBeLessThan(1e-9);
    expect(Math.abs(userReturn!.totalWithoutCacheUSD - sumWithout)).toBeLessThan(1e-9);
  });

  test("savingsUSD equals totalWithoutCacheUSD - totalWithCacheUSD", () => {
    const expected = userReturn!.totalWithoutCacheUSD - userReturn!.totalWithCacheUSD;
    expect(Math.abs(userReturn!.savingsUSD - expected)).toBeLessThan(1e-9);
    expect(userReturn!.savingsUSD).toBeGreaterThan(0);
  });

  test("savingsPercent is a positive number under 100", () => {
    expect(userReturn!.savingsPercent).toBeGreaterThan(0);
    expect(userReturn!.savingsPercent).toBeLessThan(100);
  });
});
