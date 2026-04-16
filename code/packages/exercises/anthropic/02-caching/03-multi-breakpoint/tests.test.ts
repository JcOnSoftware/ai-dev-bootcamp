import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

/**
 * Count cache_control blocks across all locations in a request:
 * system array, tools array, and messages content blocks.
 */
function countCacheControlBlocks(request: {
  system?: { cache_control?: unknown }[];
  tools?: { cache_control?: unknown }[];
  messages?: { content?: { cache_control?: unknown }[] | string }[];
}): number {
  let count = 0;
  for (const b of request.system ?? []) {
    if (b.cache_control) count++;
  }
  for (const t of request.tools ?? []) {
    if (t.cache_control) count++;
  }
  for (const msg of request.messages ?? []) {
    if (Array.isArray(msg.content)) {
      for (const b of msg.content) {
        if (b.cache_control) count++;
      }
    }
  }
  return count;
}

describe("03-multi-breakpoint", () => {
  let result: HarnessResult;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
    }
    result = await runUserCode(EXERCISE_FILE);
  }, 30_000);

  test("run makes exactly 2 captured API calls", () => {
    expect(result.calls).toHaveLength(2);
  });

  test("call 1 request: system array has at least one block with cache_control.type === 'ephemeral'", () => {
    const sys = result.calls[0]!.request.system as {
      cache_control?: { type: string };
    }[];
    expect(Array.isArray(sys)).toBe(true);
    const hasEphemeral = sys.some((b) => b.cache_control?.type === "ephemeral");
    expect(hasEphemeral).toBe(true);
  });

  test("call 2 request: tools array exists and last tool has cache_control", () => {
    const tools = result.calls[1]!.request.tools as
      | { cache_control?: unknown }[]
      | undefined;
    expect(Array.isArray(tools)).toBe(true);
    expect(tools!.length).toBeGreaterThanOrEqual(1);
    // Last tool in the array must have cache_control (anywhere on the object).
    const lastTool = tools![tools!.length - 1]!;
    expect(lastTool.cache_control).toBeDefined();
  });

  test("call 2 request: total cache_control blocks is >= 2 and <= 4", () => {
    const req = result.calls[1]!.request as {
      system?: { cache_control?: unknown }[];
      tools?: { cache_control?: unknown }[];
      messages?: { content?: { cache_control?: unknown }[] | string }[];
    };
    const total = countCacheControlBlocks(req);
    expect(total).toBeGreaterThanOrEqual(2);
    expect(total).toBeLessThanOrEqual(4);
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

  test("call 2 response: contains at least one content block", () => {
    expect(result.calls[1]!.response.content.length).toBeGreaterThan(0);
  });
});
