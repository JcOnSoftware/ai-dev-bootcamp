import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("02-model-selection", () => {
  let calls: CapturedCallGemini[];
  let userReturn: { flashLite: unknown; flash: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as { flashLite: unknown; flash: unknown } | undefined;
  }, 90_000);

  test("makes exactly two API calls", () => {
    expect(calls).toHaveLength(2);
  });

  test("uses both flash-lite and flash models (not the same one twice)", () => {
    const models = calls.map((c) => c.request["model"] as string);
    expect(models.some((m) => m.includes("flash-lite"))).toBe(true);
    expect(
      models.some((m) => /flash(?!-lite)/.test(m)),
    ).toBe(true);
  });

  test("both calls share the same prompt contents", () => {
    const prompts = calls.map((c) => {
      const c1 = c.request["contents"];
      return typeof c1 === "string" ? c1 : JSON.stringify(c1);
    });
    expect(new Set(prompts).size).toBe(1);
  });

  test("both responses have candidates with text", () => {
    for (const call of calls) {
      const candidates = call.response["candidates"] as Array<{ content: { parts: Array<{ text?: string }> } }> | undefined;
      expect(candidates).toBeDefined();
      expect(candidates!.length).toBeGreaterThan(0);
      const hasText = candidates![0]!.content.parts.some((p) => typeof p.text === "string" && p.text.length > 0);
      expect(hasText).toBe(true);
    }
  });

  test("both calls report token usage", () => {
    for (const call of calls) {
      const usage = call.response["usageMetadata"] as Record<string, number> | undefined;
      expect(usage?.["promptTokenCount"]).toBeGreaterThan(0);
      expect(usage?.["candidatesTokenCount"]).toBeGreaterThan(0);
    }
  });

  test("returns { flashLite, flash } object", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn).toHaveProperty("flashLite");
    expect(userReturn).toHaveProperty("flash");
  });
});
