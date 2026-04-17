import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface UrlContextResult {
  answer: string;
  toolRequested: boolean;
  mentionsTopic: boolean;
}

describe("04-url-context", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: UrlContextResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as UrlContextResult | undefined;
  }, 60_000);

  test("request includes the built-in urlContext tool", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const tools = config?.["tools"] as Array<Record<string, unknown>> | undefined;
    expect(Array.isArray(tools)).toBe(true);
    const hasUrlContext = tools!.some((t) => "urlContext" in t);
    expect(hasUrlContext).toBe(true);
  });

  test("prompt contains a URL (the one the model should fetch)", () => {
    const contents = String(lastCall?.request["contents"] ?? "");
    expect(contents).toMatch(/https?:\/\/[^\s]+/);
  });

  test("returns { answer, toolRequested, mentionsTopic }", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.answer).toBe("string");
    expect(typeof userReturn!.toolRequested).toBe("boolean");
    expect(typeof userReturn!.mentionsTopic).toBe("boolean");
  });

  test("answer is non-empty", () => {
    expect(userReturn!.answer.length).toBeGreaterThan(0);
  });

  test("answer references Gemini (the URL's subject)", () => {
    expect(userReturn!.mentionsTopic).toBe(true);
  });
});
