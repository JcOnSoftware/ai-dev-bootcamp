import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface RouterResult {
  chosenFunction: string;
  chosenArgs: Record<string, unknown>;
}

describe("03-multiple-tools", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: RouterResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as RouterResult | undefined;
  }, 90_000);

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("declares AT LEAST TWO function declarations", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const decls = (config?.["tools"] as Array<Record<string, unknown>>)[0]!["functionDeclarations"] as unknown[];
    expect(decls.length).toBeGreaterThanOrEqual(2);
  });

  test("one declaration is news-like and one is weather-like", () => {
    const config = lastCall?.request["config"] as Record<string, unknown>;
    const decls = (config["tools"] as Array<Record<string, unknown>>)[0]!["functionDeclarations"] as Array<
      Record<string, unknown>
    >;
    const names = decls.map((d) => String(d["name"]).toLowerCase());
    expect(names.some((n) => /news|headline/.test(n))).toBe(true);
    expect(names.some((n) => /weather/.test(n))).toBe(true);
  });

  test("returns the chosen function + args", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.chosenFunction).toBe("string");
    expect(typeof userReturn!.chosenArgs).toBe("object");
  });

  test("the model routed to news_headlines (not weather)", () => {
    // Prompt mentions AI research news — router should land on news tool.
    expect(userReturn!.chosenFunction.toLowerCase()).toMatch(/news|headline/);
  });

  test("extracted a non-empty `topic` arg", () => {
    const topic = userReturn!.chosenArgs["topic"];
    expect(typeof topic).toBe("string");
    expect((topic as string).length).toBeGreaterThan(0);
  });
});
