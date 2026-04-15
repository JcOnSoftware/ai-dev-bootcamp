import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("04-ttl-extended", () => {
  // -------- Unit tests for breakEvenCalls (no API calls) --------

  describe("breakEvenCalls helper", () => {
    let breakEvenCalls: (cacheTokens: number, pricePerMillion: number) => number;

    beforeAll(async () => {
      const mod = (await import(`${EXERCISE_FILE}?t=${Date.now()}`)) as {
        breakEvenCalls: typeof breakEvenCalls;
      };
      breakEvenCalls = mod.breakEvenCalls;
    });

    test("breakEvenCalls is exported as a named function", () => {
      expect(typeof breakEvenCalls).toBe("function");
    });

    test("returns a positive integer for typical inputs", () => {
      const result = breakEvenCalls(4200, 1.0);
      expect(result).toBeGreaterThan(0);
      expect(Number.isInteger(result)).toBe(true);
    });

    test("result is between 1 and 20 for reasonable inputs", () => {
      // write1h = 2.0x, write5m = 1.25x, read = 0.1x
      // N > (write1h - write5m) / (write5m - read) = (2.0 - 1.25) / (1.25 - 0.1) = 0.75 / 1.15 ≈ 0.65
      // So breakEvenCalls should be 1 for any reasonable input.
      const result = breakEvenCalls(4200, 1.0);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    });

    test("larger cache token counts don't produce negative or zero results", () => {
      const result = breakEvenCalls(100_000, 1.0);
      expect(result).toBeGreaterThan(0);
    });

    test("higher price per million doesn't change the relative break-even ratio", () => {
      // The formula is scale-invariant with respect to price.
      const r1 = breakEvenCalls(4200, 1.0);
      const r2 = breakEvenCalls(4200, 15.0);
      // Both should be the same integer (price cancels out in ratio).
      expect(r1).toBe(r2);
    });
  });

  // -------- Integration tests for run() (real API) --------

  describe("run (integration)", () => {
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

    test("call 1 request: system has a block with cache_control containing ttl '1h'", () => {
      const sys = result.calls[0]!.request.system as {
        cache_control?: { type: string; ttl?: string };
      }[];
      const has1h = sys.some(
        (b) => b.cache_control?.ttl === "1h" || JSON.stringify(b.cache_control).includes("1h"),
      );
      expect(has1h).toBe(true);
    });

    test("call 1 response: cache activity > 0 (creation or read)", () => {
      const usage = result.calls[0]!.response.usage as {
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
      };
      const activity =
        (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
      expect(activity).toBeGreaterThan(0);
    });

    test("call 2 response: cache_read_input_tokens > 0", () => {
      const usage = result.calls[1]!.response.usage as {
        cache_read_input_tokens?: number;
      };
      expect((usage.cache_read_input_tokens ?? 0)).toBeGreaterThan(0);
    });

    test("both requests use a Haiku model", () => {
      for (const call of result.calls) {
        expect(call.request.model).toMatch(/haiku/i);
      }
    });
  });
});
