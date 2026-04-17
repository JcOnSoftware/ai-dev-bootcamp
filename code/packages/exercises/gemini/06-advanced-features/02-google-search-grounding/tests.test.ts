import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface GroundedAnswer {
  answer: string;
  hasGroundingMetadata: boolean;
  sourceCount: number;
}

describe("02-google-search-grounding", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: GroundedAnswer | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as GroundedAnswer | undefined;
  }, 60_000);

  test("makes exactly one generateContent call", () => {
    expect(calls.filter((c) => c.method === "generateContent")).toHaveLength(1);
  });

  test("request includes the built-in googleSearch tool", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const tools = config?.["tools"] as Array<Record<string, unknown>> | undefined;
    expect(Array.isArray(tools)).toBe(true);
    const hasGoogleSearch = tools!.some((t) => "googleSearch" in t);
    expect(hasGoogleSearch).toBe(true);
  });

  test("returns non-empty answer", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn!.answer.length).toBeGreaterThan(0);
  });

  test("groundingMetadata is present (search actually ran)", () => {
    expect(userReturn!.hasGroundingMetadata).toBe(true);
  });

  test("sourceCount > 0 (the search returned at least one grounding chunk)", () => {
    expect(userReturn!.sourceCount).toBeGreaterThan(0);
  });

  test("answer is about the Best Picture Oscar (mentions 'Oppenheimer' or related)", () => {
    // The 2024 winner was Oppenheimer. Accept either the name or a clear
    // Oscar-related phrase to keep the test tolerant to model phrasing.
    const ans = userReturn!.answer.toLowerCase();
    expect(/oppenheimer|best picture|oscar|academy award/.test(ans)).toBe(true);
  });
});
