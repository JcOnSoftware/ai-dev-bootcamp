import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-cached-tokens-monitoring", () => {
  let calls: CapturedCallOpenAI[];
  let userReturn:
    | { call1CachedTokens: number; call2CachedTokens: number; cacheImproved: boolean }
    | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    userReturn = raw.userReturn as
      | { call1CachedTokens: number; call2CachedTokens: number; cacheImproved: boolean }
      | undefined;
  });

  test("makes exactly 2 API calls", () => {
    expect(calls).toHaveLength(2);
  });

  test("both calls use gpt-4.1-nano", () => {
    expect(calls[0]?.request.model).toBe("gpt-4.1-nano");
    expect(calls[1]?.request.model).toBe("gpt-4.1-nano");
  });

  test("both calls use the same system prompt", () => {
    const sys1 = calls[0]?.request.messages[0]?.content;
    const sys2 = calls[1]?.request.messages[0]?.content;
    expect(sys1).toBe(sys2);
  });

  test("call1CachedTokens is a non-negative number", () => {
    expect(typeof userReturn?.call1CachedTokens).toBe("number");
    expect(userReturn?.call1CachedTokens).toBeGreaterThanOrEqual(0);
  });

  test("call2CachedTokens is a non-negative number", () => {
    expect(typeof userReturn?.call2CachedTokens).toBe("number");
    expect(userReturn?.call2CachedTokens).toBeGreaterThanOrEqual(0);
  });

  test("cacheImproved field is a boolean", () => {
    expect(typeof userReturn?.cacheImproved).toBe("boolean");
  });

  // NOTE: we do NOT assert cacheImproved === true because prompt caching is
  // automatic and probabilistic — it may not always trigger in test environments.
  // The exercise goal is to OBSERVE and MONITOR, not to guarantee a cache hit.
});
