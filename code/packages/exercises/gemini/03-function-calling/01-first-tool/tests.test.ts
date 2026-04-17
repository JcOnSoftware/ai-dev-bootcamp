import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface FirstToolResult {
  calledFunction: string;
  calledArgs: Record<string, unknown>;
}

describe("01-first-tool", () => {
  let calls: CapturedCallGemini[];
  let lastCall: CapturedCallGemini | undefined;
  let userReturn: FirstToolResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as FirstToolResult | undefined;
  }, 30_000);

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("request.config.tools declares at least one function", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const tools = config?.["tools"] as Array<Record<string, unknown>> | undefined;
    expect(Array.isArray(tools)).toBe(true);
    expect(tools!.length).toBeGreaterThan(0);
    const decls = tools![0]!["functionDeclarations"] as unknown[] | undefined;
    expect(Array.isArray(decls)).toBe(true);
    expect(decls!.length).toBeGreaterThan(0);
  });

  test("the declaration targets a weather-like function with a 'location' param", () => {
    const config = lastCall?.request["config"] as Record<string, unknown> | undefined;
    const tools = config?.["tools"] as Array<Record<string, unknown>>;
    const decl = (tools[0]!["functionDeclarations"] as Array<Record<string, unknown>>)[0];
    expect(typeof decl!["name"]).toBe("string");
    // Loose name match — accept get_weather, current_weather, weatherInfo, etc.
    expect((decl!["name"] as string).toLowerCase()).toMatch(/weather/);
    const params = decl!["parameters"] as Record<string, unknown>;
    const props = params["properties"] as Record<string, unknown>;
    expect(props["location"]).toBeDefined();
  });

  test("returns { calledFunction, calledArgs }", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.calledFunction).toBe("string");
    expect(userReturn!.calledArgs).toBeDefined();
    expect(typeof userReturn!.calledArgs).toBe("object");
  });

  test("the model chose to call the weather function (not emit plain text)", () => {
    expect(userReturn!.calledFunction.toLowerCase()).toMatch(/weather/);
  });

  test("the function call args include a non-empty 'location'", () => {
    const location = userReturn!.calledArgs["location"];
    expect(typeof location).toBe("string");
    expect((location as string).length).toBeGreaterThan(0);
    // The prompt mentions Tokyo — a healthy extraction should include it.
    expect((location as string).toLowerCase()).toMatch(/tokyo/);
  });
});
