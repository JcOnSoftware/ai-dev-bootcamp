import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface StreamReport {
  text: string;
  chunkCount: number;
}

describe("04-streaming", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: StreamReport | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as StreamReport | undefined;
  }, 30_000);

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("uses the streaming method (generateContentStream)", () => {
    expect(lastCall?.method).toBe("generateContentStream");
    expect(lastCall?.streamed).toBe(true);
  });

  test("uses a Gemini model", () => {
    const model = (lastCall?.request["model"] as string | undefined) ?? "";
    expect(model).toMatch(/^gemini-/);
  });

  test("returns { text, chunkCount }", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.text).toBe("string");
    expect(typeof userReturn!.chunkCount).toBe("number");
  });

  test("accumulated text is non-empty", () => {
    expect(userReturn!.text.length).toBeGreaterThan(0);
  });

  test("chunkCount is at least 1 (model emitted at least one chunk)", () => {
    expect(userReturn!.chunkCount).toBeGreaterThanOrEqual(1);
  });

  test("assembled response has candidates (harness reconstructed the full message)", () => {
    const candidates = lastCall?.response["candidates"] as Array<{ content: { parts: Array<{ text?: string }> } }> | undefined;
    expect(candidates).toBeDefined();
    expect(candidates!.length).toBeGreaterThan(0);
  });
});
