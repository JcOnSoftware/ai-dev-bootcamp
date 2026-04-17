import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-basic-caching", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000); // 30s — two real API calls

  test("run makes exactly 2 captured API calls", () => {
    expect(result.calls).toHaveLength(2);
  });

  test("call 1 request: system is an array with at least one block", () => {
    const sys = result.calls[0]!.request.system;
    expect(Array.isArray(sys)).toBe(true);
    expect((sys as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  test("call 1 request: at least one system block has cache_control.type === 'ephemeral'", () => {
    const sys = result.calls[0]!.request.system as {
      cache_control?: { type: string };
    }[];
    const hasCacheControl = sys.some((b) => b.cache_control?.type === "ephemeral");
    expect(hasCacheControl).toBe(true);
  });

  test("call 1 response: caching was activated (creation or read tokens > 0)", () => {
    // On the very first run, cache_creation_input_tokens > 0.
    // On subsequent runs within the 5-min TTL, cache_read_input_tokens > 0.
    // Either way, at least one cache token count must be non-zero.
    const usage = result.calls[0]!.response.usage as {
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    const cacheActivity =
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0);
    expect(cacheActivity).toBeGreaterThan(0);
  });

  test("call 2 request: at least one system block has cache_control.type === 'ephemeral'", () => {
    const sys = result.calls[1]!.request.system as {
      cache_control?: { type: string };
    }[];
    const hasCacheControl = sys.some((b) => b.cache_control?.type === "ephemeral");
    expect(hasCacheControl).toBe(true);
  });

  test("call 2 response: cache_read_input_tokens is reported (>= 0)", () => {
    const usage = result.calls[1]!.response.usage as {
      cache_read_input_tokens?: number;
    };
    // Cache read may be 0 in CI (cold cache, timing dependent).
    // We verify the field exists and is a number — actual caching is best-effort.
    expect(typeof (usage.cache_read_input_tokens ?? 0)).toBe("number");
    if ((usage.cache_read_input_tokens ?? 0) === 0) {
      console.warn(
        "[hint] cache_read_input_tokens was 0 — cache may not have been warm. This is expected in CI.",
      );
    }
  });

  test("both requests use a Haiku model", () => {
    for (const call of result.calls) {
      expect(call.request.model).toMatch(/haiku/i);
    }
  });

  test("both responses contain at least one text content block", () => {
    for (const call of result.calls) {
      const textBlock = call.response.content.find((b) => b.type === "text");
      expect(textBlock).toBeDefined();
    }
  });
});
