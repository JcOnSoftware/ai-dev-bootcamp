import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// Type contracts matching what the exercise must export.
interface CacheUsage {
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  input_tokens: number;
  output_tokens: number;
}

interface CacheStats {
  cached: number;
  created: number;
  regular: number;
  savings_pct: number;
  effective_cost_usd: number;
}

describe("02-cache-hit-metrics", () => {
  // -------- Unit tests for cacheStats (no API calls) --------

  describe("cacheStats helper", () => {
    let cacheStats: (usage: CacheUsage) => CacheStats;

    beforeAll(async () => {
      // Import the exercise module to grab the named cacheStats export.
      const mod = (await import(`${EXERCISE_FILE}?t=${Date.now()}`)) as {
        cacheStats: typeof cacheStats;
      };
      cacheStats = mod.cacheStats;
    });

    test("cacheStats is exported as a named function", () => {
      expect(typeof cacheStats).toBe("function");
    });

    test("returns an object with all 5 required keys", () => {
      const stats = cacheStats({
        cache_read_input_tokens: 5000,
        cache_creation_input_tokens: 0,
        input_tokens: 50,
        output_tokens: 100,
      });
      expect(stats).toHaveProperty("cached");
      expect(stats).toHaveProperty("created");
      expect(stats).toHaveProperty("regular");
      expect(stats).toHaveProperty("savings_pct");
      expect(stats).toHaveProperty("effective_cost_usd");
    });

    test("cached equals cache_read_input_tokens", () => {
      const stats = cacheStats({
        cache_read_input_tokens: 5000,
        cache_creation_input_tokens: 0,
        input_tokens: 50,
        output_tokens: 100,
      });
      expect(stats.cached).toBe(5000);
    });

    test("created equals cache_creation_input_tokens", () => {
      const stats = cacheStats({
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 4200,
        input_tokens: 50,
        output_tokens: 100,
      });
      expect(stats.created).toBe(4200);
    });

    test("savings_pct is a number between 0 and 100", () => {
      const stats = cacheStats({
        cache_read_input_tokens: 5000,
        cache_creation_input_tokens: 0,
        input_tokens: 50,
        output_tokens: 100,
      });
      expect(stats.savings_pct).toBeGreaterThanOrEqual(0);
      expect(stats.savings_pct).toBeLessThanOrEqual(100);
    });

    test("savings_pct > 50 when most tokens are cached reads (0.1x price)", () => {
      // 5000 cached-read tokens at 0.1x vs. 5000 regular at 1.0x = 90% savings
      const stats = cacheStats({
        cache_read_input_tokens: 5000,
        cache_creation_input_tokens: 0,
        input_tokens: 50,
        output_tokens: 0,
      });
      expect(stats.savings_pct).toBeGreaterThan(50);
    });

    test("effective_cost_usd is a positive finite number", () => {
      const stats = cacheStats({
        cache_read_input_tokens: 5000,
        cache_creation_input_tokens: 0,
        input_tokens: 50,
        output_tokens: 100,
      });
      expect(stats.effective_cost_usd).toBeGreaterThan(0);
      expect(isFinite(stats.effective_cost_usd)).toBe(true);
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
    }, 30_000); // 30s — two real API calls

    test("run makes exactly 2 captured API calls", () => {
      expect(result.calls).toHaveLength(2);
    });

    test("both requests use a Haiku model", () => {
      for (const call of result.calls) {
        expect(call.request.model).toMatch(/haiku/i);
      }
    });

    test("call 2 response: cache_read_input_tokens > 0", () => {
      const usage = result.calls[1]!.response.usage as {
        cache_read_input_tokens?: number;
      };
      expect((usage.cache_read_input_tokens ?? 0)).toBeGreaterThan(0);
    });

    test("run returns a CacheStats object with all 5 keys", () => {
      const stats = result.userReturn as CacheStats;
      expect(stats).toHaveProperty("cached");
      expect(stats).toHaveProperty("created");
      expect(stats).toHaveProperty("regular");
      expect(stats).toHaveProperty("savings_pct");
      expect(stats).toHaveProperty("effective_cost_usd");
    });

    test("returned stats.savings_pct > 50 (cached read is 0.1x vs full input)", () => {
      const stats = result.userReturn as CacheStats;
      expect(stats.savings_pct).toBeGreaterThan(50);
    });

    test("returned stats.effective_cost_usd is a positive finite number", () => {
      const stats = result.userReturn as CacheStats;
      expect(stats.effective_cost_usd).toBeGreaterThan(0);
      expect(isFinite(stats.effective_cost_usd)).toBe(true);
    });
  });
});
