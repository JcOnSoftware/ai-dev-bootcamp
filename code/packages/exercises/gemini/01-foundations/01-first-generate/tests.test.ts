import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("01-first-generate", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
  }, 90_000);

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("uses the non-streaming generateContent method", () => {
    expect(lastCall?.method).toBe("generateContent");
    expect(lastCall?.streamed).toBe(false);
  });

  test("uses a Gemini model (gemini-2.5-flash-lite preferred)", () => {
    const model = (lastCall?.request["model"] as string | undefined) ?? "";
    expect(model).toMatch(/^gemini-/);
    if (!model.includes("flash-lite")) {
      console.warn(
        `[hint] You used '${model}'. gemini-2.5-flash-lite is cheapest for this exercise — try it next time.`,
      );
    }
  });

  test("passes non-empty contents", () => {
    const contents = lastCall?.request["contents"];
    expect(contents).toBeDefined();
    const str = typeof contents === "string" ? contents : JSON.stringify(contents);
    expect(str.length).toBeGreaterThan(0);
  });

  test("response has at least one candidate with text parts", () => {
    const candidates = lastCall?.response["candidates"] as Array<{ content: { parts: Array<{ text?: string }> } }> | undefined;
    expect(candidates).toBeDefined();
    expect(candidates!.length).toBeGreaterThan(0);
    const parts = candidates![0]!.content.parts;
    const hasText = parts.some((p) => typeof p.text === "string" && p.text.length > 0);
    expect(hasText).toBe(true);
  });

  test("reports token usage via usageMetadata", () => {
    const usage = lastCall?.response["usageMetadata"] as Record<string, number> | undefined;
    expect(usage).toBeDefined();
    expect(usage!["promptTokenCount"]).toBeGreaterThan(0);
    expect(usage!["candidatesTokenCount"]).toBeGreaterThan(0);
  });
});
