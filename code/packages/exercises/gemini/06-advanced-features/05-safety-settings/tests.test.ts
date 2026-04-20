import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface SafetyResult {
  answer: string;
  finishReason: string;
  configuredCategories: string[];
}

describe("05-safety-settings", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: SafetyResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as SafetyResult | undefined;
  }, 90_000);

  test("makes exactly one generateContent call", () => {
    expect(calls.filter((c) => c.method === "generateContent")).toHaveLength(1);
  });

  test("request.config.safetySettings has at least 4 entries", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const ss = config?.["safetySettings"] as unknown[] | undefined;
    expect(Array.isArray(ss)).toBe(true);
    expect(ss!.length).toBeGreaterThanOrEqual(4);
  });

  test("every entry has category + threshold as strings", () => {
    const config = lastCall?.request["config"] as Record<string, unknown>;
    const ss = config["safetySettings"] as Array<Record<string, unknown>>;
    for (const entry of ss) {
      expect(typeof entry["category"]).toBe("string");
      expect(typeof entry["threshold"]).toBe("string");
    }
  });

  test("covers the 4 core HarmCategories (HARASSMENT, HATE_SPEECH, SEXUALLY_EXPLICIT, DANGEROUS_CONTENT)", () => {
    const config = lastCall?.request["config"] as Record<string, unknown>;
    const ss = config["safetySettings"] as Array<Record<string, unknown>>;
    const cats = ss.map((e) => String(e["category"]));
    expect(cats.some((c) => /HARASSMENT/.test(c))).toBe(true);
    expect(cats.some((c) => /HATE_SPEECH/.test(c))).toBe(true);
    expect(cats.some((c) => /SEXUALLY_EXPLICIT/.test(c))).toBe(true);
    expect(cats.some((c) => /DANGEROUS_CONTENT/.test(c))).toBe(true);
  });

  test("returns { answer, finishReason, configuredCategories }", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.answer).toBe("string");
    expect(typeof userReturn!.finishReason).toBe("string");
    expect(Array.isArray(userReturn!.configuredCategories)).toBe(true);
  });

  test("benign prompt produced a non-empty answer (not SAFETY-blocked)", () => {
    // The joke prompt is intentionally harmless; the model should NOT
    // block. finishReason can legitimately be STOP or MAX_TOKENS; SAFETY
    // would mean we tripped a block that should not have fired.
    expect(userReturn!.answer.length).toBeGreaterThan(0);
    expect(userReturn!.finishReason).not.toBe("SAFETY");
  });

  test("configuredCategories reports the 4 categories back", () => {
    expect(userReturn!.configuredCategories.length).toBeGreaterThanOrEqual(4);
  });
});
