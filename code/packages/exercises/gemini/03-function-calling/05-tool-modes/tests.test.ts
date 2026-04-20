import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface ModesResult {
  autoCalled: boolean;
  forcedFunctionName: string;
}

describe("05-tool-modes", () => {
  let calls: CapturedCallGemini[];
  let userReturn: ModesResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as ModesResult | undefined;
  }, 120_000);

  test("makes exactly two API calls (AUTO + ANY)", () => {
    expect(calls).toHaveLength(2);
  });

  test("both calls declare the weather tool", () => {
    for (const c of calls) {
      const config = c.request["config"] as Record<string, unknown> | undefined;
      const tools = config?.["tools"] as Array<Record<string, unknown>> | undefined;
      expect(Array.isArray(tools)).toBe(true);
      const decls = tools![0]!["functionDeclarations"] as unknown[];
      expect(decls.length).toBeGreaterThan(0);
    }
  });

  test("one call sets mode AUTO and the other sets mode ANY", () => {
    const modes = calls.map((c) => {
      const cfg = c.request["config"] as Record<string, unknown>;
      const tc = cfg["toolConfig"] as Record<string, unknown> | undefined;
      const fcc = tc?.["functionCallingConfig"] as Record<string, unknown> | undefined;
      return String(fcc?.["mode"] ?? "");
    });
    expect(modes).toContain("AUTO");
    expect(modes).toContain("ANY");
  });

  test("returns { autoCalled: boolean, forcedFunctionName: string }", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.autoCalled).toBe("boolean");
    expect(typeof userReturn!.forcedFunctionName).toBe("string");
  });

  test("under mode ANY the model called get_weather (forced)", () => {
    expect(userReturn!.forcedFunctionName).toBe("get_weather");
  });

  test("under mode AUTO on an unrelated prompt, the model did NOT call the tool", () => {
    // The prompt is "tell me a joke" — no reason to call a weather tool when
    // the model is free to answer in text. This test is a bit model-dependent;
    // if it flakes, the LESSON is still correct and the test expresses intent.
    expect(userReturn!.autoCalled).toBe(false);
  });
});
