import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface CachedAnswer {
  cacheName: string;
  answer: string;
  cachedTokens: number;
  freshInputTokens: number;
}

describe("03-use-cached-content", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: CachedAnswer | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as CachedAnswer | undefined;
  }, 120_000);

  test("makes exactly one generateContent call", () => {
    const generate = calls.filter((c) => c.method === "generateContent");
    expect(generate).toHaveLength(1);
  });

  test("generateContent passes config.cachedContent referencing the cache", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const cachedContent = config?.["cachedContent"];
    expect(typeof cachedContent).toBe("string");
    expect(cachedContent as string).toMatch(/^cachedContents\//);
  });

  test("returns non-empty answer string", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn!.answer.length).toBeGreaterThan(0);
  });

  test("cachedTokens > 0 — cache was actually used", () => {
    // This is THE proof of cache hit. If this fails, the request didn't route
    // through the cache (wrong name, expired TTL, or wrong model).
    expect(userReturn!.cachedTokens).toBeGreaterThan(0);
  });

  test("cachedTokens roughly matches the size of the stored document", () => {
    // longDoc is ~200 lines × ~30 tokens ≈ ~6000 tokens. Allow wide range.
    expect(userReturn!.cachedTokens).toBeGreaterThan(1000);
  });

  test("freshInputTokens is much smaller than cachedTokens (that's the whole point)", () => {
    // The savings story: most of the prompt came from cache, only a little
    // fresh input was reprocessed (the question itself).
    expect(userReturn!.freshInputTokens).toBeLessThan(userReturn!.cachedTokens);
  });

  test("cacheName matches the cachedContent on the request", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    expect(userReturn!.cacheName).toBe(config?.["cachedContent"] as string);
  });
});
