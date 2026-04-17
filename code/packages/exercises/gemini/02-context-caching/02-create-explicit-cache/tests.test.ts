import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface CacheCreated {
  name: string;
  model: string;
  displayName?: string;
  hasExpireTime: boolean;
  tokensCached: number;
}

describe("02-create-explicit-cache", () => {
  let calls: CapturedCallGemini[];
  let userReturn: CacheCreated | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as CacheCreated | undefined;
  }, 60_000);

  test("does not call generateContent (this exercise is about caches only)", () => {
    // Harness only patches generateContent/Stream/embed. A caches.create call
    // would not appear in `calls` — so calls should be empty.
    const generateCalls = calls.filter(
      (c) => c.method === "generateContent" || c.method === "generateContentStream",
    );
    expect(generateCalls).toHaveLength(0);
  });

  test("returns cache metadata with a resource name", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.name).toBe("string");
    // Cache names look like "cachedContents/<id>".
    expect(userReturn!.name).toMatch(/^cachedContents\//);
  });

  test("reports the model the cache was created for", () => {
    expect(typeof userReturn!.model).toBe("string");
    // The SDK returns the fully-qualified name, e.g. "models/gemini-2.5-flash".
    expect(userReturn!.model).toMatch(/gemini-/);
  });

  test("uses the suggested displayName", () => {
    expect(userReturn!.displayName).toBe("amazon-doc-cache");
  });

  test("cache has an expireTime (TTL was set)", () => {
    expect(userReturn!.hasExpireTime).toBe(true);
  });

  test("reports the number of tokens cached (roughly matches the longDoc size)", () => {
    expect(userReturn!.tokensCached).toBeGreaterThan(1000);
  });
});
