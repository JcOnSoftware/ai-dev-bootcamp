import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface CodeExecResult {
  generatedCode: string;
  sandboxOutput: string;
  summary: string;
}

describe("03-code-execution", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: CodeExecResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as CodeExecResult | undefined;
  }, 60_000);

  test("request includes the built-in codeExecution tool", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const tools = config?.["tools"] as Array<Record<string, unknown>> | undefined;
    expect(Array.isArray(tools)).toBe(true);
    const hasCodeExec = tools!.some((t) => "codeExecution" in t);
    expect(hasCodeExec).toBe(true);
  });

  test("returns { generatedCode, sandboxOutput, summary } as strings", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.generatedCode).toBe("string");
    expect(typeof userReturn!.sandboxOutput).toBe("string");
    expect(typeof userReturn!.summary).toBe("string");
  });

  test("generatedCode looks like Python (mentions def, print, or operators)", () => {
    expect(userReturn!.generatedCode.length).toBeGreaterThan(0);
    // Loose check — any of these markers count as "looks like Python".
    expect(/print|sum|range|import|def |=/.test(userReturn!.generatedCode)).toBe(true);
  });

  test("sandboxOutput contains 391 (= 17 * 23)", () => {
    expect(userReturn!.sandboxOutput).toMatch(/\b391\b/);
  });

  test("sandboxOutput contains 5050 (= sum of 1..100)", () => {
    expect(userReturn!.sandboxOutput).toMatch(/\b5050\b/);
  });

  test("summary text is non-empty", () => {
    expect(userReturn!.summary.length).toBeGreaterThan(0);
  });
});
