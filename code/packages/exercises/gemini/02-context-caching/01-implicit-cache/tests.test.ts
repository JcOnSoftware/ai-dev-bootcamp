import { describe, test, expect, beforeAll } from "bun:test";
import { GoogleGenAI } from "@google/genai";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";
import { longDoc } from "./solution.ts";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface ImplicitCacheResult {
  firstUsage: Record<string, number | undefined>;
  secondUsage: Record<string, number | undefined>;
}

describe("01-implicit-cache", () => {
  let calls: CapturedCallGemini[];
  let userReturn: ImplicitCacheResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    // Pre-warm Gemini's implicit cache for this exact prefix so the learner's
    // two same-prefix calls reliably show `cachedContentTokenCount > 0`.
    // Without warmup, the FIRST time this prefix is seen it is not yet cached
    // server-side, and depending on timing the learner's second call may or
    // may not land on a warm cache. This is a test-harness concern, not a
    // concept the learner needs to understand.
    const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${longDoc}\n\nQuestion: warmup question.`,
      config: { maxOutputTokens: 16 },
    });

    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as ImplicitCacheResult | undefined;
  }, 60_000);

  test("makes exactly two API calls", () => {
    expect(calls).toHaveLength(2);
  });

  test("both calls share the same prefix (cache-eligible)", () => {
    const contents = calls.map((c) => String(c.request["contents"] ?? ""));
    // Extract the prefix before "Question:" — they must match byte-for-byte.
    const prefixes = contents.map((s) => s.split("Question:")[0]);
    expect(prefixes[0]).toBe(prefixes[1]);
    // Ensure the prefix is large enough to be cache-eligible (~1024+ tokens).
    expect((prefixes[0] ?? "").length).toBeGreaterThan(4000);
  });

  test("both calls reach the API and receive candidates", () => {
    for (const call of calls) {
      const candidates = call.response["candidates"] as unknown[] | undefined;
      expect(Array.isArray(candidates)).toBe(true);
      expect(candidates!.length).toBeGreaterThan(0);
    }
  });

  test("returns { firstUsage, secondUsage } both with promptTokenCount", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.firstUsage.promptTokenCount).toBe("number");
    expect(typeof userReturn!.secondUsage.promptTokenCount).toBe("number");
    expect(userReturn!.firstUsage.promptTokenCount!).toBeGreaterThan(1000);
    expect(userReturn!.secondUsage.promptTokenCount!).toBeGreaterThan(1000);
  });

  test("second call reports cachedContentTokenCount (implicit cache hit)", () => {
    // This is the key learning: Gemini's implicit caching kicks in for a
    // sufficiently large shared prefix on the 2nd request.
    // Small chance Google doesn't cache (e.g. model capacity fluctuation) —
    // if this fails intermittently, the concept is still taught correctly
    // but the test may need retry logic. For now we assert on the intent.
    const cached = userReturn!.secondUsage.cachedContentTokenCount ?? 0;
    expect(cached).toBeGreaterThan(0);
  });
});
