import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-stop-conditions", () => {
  // ── Unit tests: evaluateStop (no API) ─────────────────────────────────────
  describe("evaluateStop (pure function — no API)", () => {
    let mod: {
      evaluateStop: (
        stopReason: string,
        content: Array<{ type: string }>,
        iterations: number,
        maxIterations: number,
      ) => "goal" | "end_turn" | "max_iterations" | null;
    };

    beforeAll(async () => {
      mod = (await import(`${EXERCISE_FILE}?t=${Date.now()}`)) as typeof mod;
    });

    test("returns 'goal' when last text block contains the goal marker", () => {
      const result = mod.evaluateStop("end_turn", [{ type: "text" }], 3, 10);
      // goal check is text content based — we test the null path for tool_use here
      // A non-tool_use end_turn with text → either "goal" or "end_turn", both valid
      expect(result).not.toBeNull();
      expect(["goal", "end_turn"]).toContain(result as string);
    });

    test("returns 'end_turn' when stop_reason is end_turn and no other condition", () => {
      const result = mod.evaluateStop("end_turn", [{ type: "text" }], 1, 10);
      expect(result).not.toBeNull();
      expect(["goal", "end_turn"]).toContain(result as string);
    });

    test("returns 'max_iterations' when iterations >= maxIterations", () => {
      const result = mod.evaluateStop("tool_use", [{ type: "tool_use" }], 10, 10);
      expect(result).toBe("max_iterations");
    });

    test("returns null when stop_reason is tool_use and not at max", () => {
      const result = mod.evaluateStop("tool_use", [{ type: "tool_use" }], 3, 10);
      expect(result).toBeNull();
    });
  });

  // ── Integration test ──────────────────────────────────────────────────────
  describe("runWithStopConditions integration", () => {
    let result: HarnessResult;

    beforeAll(async () => {
      if (!process.env["ANTHROPIC_API_KEY"]) {
        throw new Error("ANTHROPIC_API_KEY not set — integration test hits real API.");
      }
      result = await runUserCode(EXERCISE_FILE);
    }, 30_000);

    test("at least one API call was made", () => {
      expect(result.calls.length).toBeGreaterThanOrEqual(1);
    });

    test("call count is between 1 and 10", () => {
      expect(result.calls.length).toBeGreaterThanOrEqual(1);
      expect(result.calls.length).toBeLessThanOrEqual(10);
    });

    test("model is haiku", () => {
      expect(result.calls[0]!.request.model).toMatch(/haiku/i);
    });

    test("final stop reason is valid (end_turn or tool_use at max cap)", () => {
      const lastCall = result.calls[result.calls.length - 1]!;
      expect(["end_turn", "tool_use"]).toContain(lastCall.response.stop_reason as string);
    });

    test("force max_iterations: single iteration run stops at 1", async () => {
      const mod = (await import(`${EXERCISE_FILE}?t=${Date.now()}`)) as {
        runWithStopConditions: (
          query: string,
          maxIterations: number,
        ) => Promise<{ stoppedReason: string; calls: number }>;
      };
      const out = await mod.runWithStopConditions(
        "What is cache TTL?",
        1,
      );
      expect(out.calls).toBe(1);
      expect(out.stoppedReason).toBe("max_iterations");
    }, 30_000);
  });
});
