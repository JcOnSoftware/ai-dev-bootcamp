import { describe, test, expect, beforeAll, spyOn } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// Minimal fake error that matches the shape withRetry checks for (status + name).
class FakeApiError extends Error {
  constructor(
    public override readonly name: string,
    public readonly status: number | undefined,
    message = "fake",
  ) {
    super(message);
  }
}

describe("05-error-handling", () => {
  let withRetry: <T>(
    fn: () => Promise<T>,
    options?: { maxAttempts?: number; baseDelayMs?: number; jitter?: boolean },
  ) => Promise<T>;

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — the integration test hits the real API.");
    }
    // Import the exercise module directly to grab the named `withRetry` export.
    const mod = (await import(`${EXERCISE_FILE}?t=${Date.now()}`)) as {
      withRetry: typeof withRetry;
    };
    withRetry = mod.withRetry;
  });

  // -------- Unit tests for withRetry (no API calls) --------

  describe("withRetry", () => {
    test("returns the value on first success without retries", async () => {
      let calls = 0;
      const result = await withRetry(async () => {
        calls++;
        return "ok";
      });
      expect(result).toBe("ok");
      expect(calls).toBe(1);
    });

    test("retries on 429 then returns success", async () => {
      let calls = 0;
      const result = await withRetry(
        async () => {
          calls++;
          if (calls === 1) throw new FakeApiError("RateLimitError", 429);
          return "recovered";
        },
        { baseDelayMs: 1 },
      );
      expect(result).toBe("recovered");
      expect(calls).toBe(2);
    });

    test("retries on 5xx then returns success", async () => {
      let calls = 0;
      const result = await withRetry(
        async () => {
          calls++;
          if (calls < 2) throw new FakeApiError("InternalServerError", 503);
          return "ok";
        },
        { baseDelayMs: 1 },
      );
      expect(result).toBe("ok");
      expect(calls).toBe(2);
    });

    test("does NOT retry on 401 auth error", async () => {
      let calls = 0;
      await expect(
        withRetry(
          async () => {
            calls++;
            throw new FakeApiError("AuthenticationError", 401);
          },
          { baseDelayMs: 1 },
        ),
      ).rejects.toBeInstanceOf(FakeApiError);
      expect(calls).toBe(1);
    });

    test("rethrows after maxAttempts when all calls fail", async () => {
      let calls = 0;
      await expect(
        withRetry(
          async () => {
            calls++;
            throw new FakeApiError("RateLimitError", 429);
          },
          { maxAttempts: 3, baseDelayMs: 1 },
        ),
      ).rejects.toBeInstanceOf(FakeApiError);
      expect(calls).toBe(3);
    });

    test("applies jitter when option is true", async () => {
      const randomSpy = spyOn(Math, "random").mockReturnValue(0.5);
      try {
        let calls = 0;
        const started = performance.now();
        await withRetry(
          async () => {
            calls++;
            if (calls === 1) throw new FakeApiError("RateLimitError", 429);
            return "ok";
          },
          { maxAttempts: 2, baseDelayMs: 100, jitter: true },
        );
        const elapsed = performance.now() - started;
        // Without jitter: 100ms. With jitter (Math.random = 0.5): 100 + 0.5*100 = 150ms.
        expect(calls).toBe(2);
        expect(elapsed).toBeGreaterThanOrEqual(140);
        expect(randomSpy).toHaveBeenCalled();
      } finally {
        randomSpy.mockRestore();
      }
    });

    test("delay grows exponentially between retries", async () => {
      let calls = 0;
      const started = performance.now();
      await expect(
        withRetry(
          async () => {
            calls++;
            throw new FakeApiError("RateLimitError", 429);
          },
          { maxAttempts: 3, baseDelayMs: 50 },
        ),
      ).rejects.toBeDefined();
      const elapsed = performance.now() - started;
      // Delays: 50 (after 1st fail) + 100 (after 2nd fail) = ~150ms minimum.
      // Tolerate timer slop upward generously; lower bound is the key signal.
      expect(calls).toBe(3);
      expect(elapsed).toBeGreaterThanOrEqual(140);
    });
  });

  // -------- Integration test for run() (real API) --------

  describe("run (integration)", () => {
    let result: HarnessResult;

    beforeAll(async () => {
      result = await runUserCode(EXERCISE_FILE);
    });

    test("run makes exactly one captured API call", () => {
      expect(result.calls).toHaveLength(1);
    });

    test("run uses a Claude Haiku model", () => {
      const model = result.lastCall?.request.model ?? "";
      expect(model).toMatch(/^claude-/);
      expect(model).toContain("haiku");
    });

    test("run returns a Message with at least one text block", () => {
      const message = result.userReturn as {
        content?: { type: string; text?: string }[];
      };
      expect(Array.isArray(message?.content)).toBe(true);
      const textBlock = message.content?.find((b) => b.type === "text");
      expect(textBlock).toBeDefined();
    });
  });
});
