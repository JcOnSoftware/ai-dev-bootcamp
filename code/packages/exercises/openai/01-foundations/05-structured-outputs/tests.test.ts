import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

describe("05-structured-outputs", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { response: unknown; parsed: unknown } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { response: unknown; parsed: unknown } | undefined;
  });

  test("makes exactly one API call", () => {
    expect(calls).toHaveLength(1);
  });

  test("request includes response_format with type json_schema", () => {
    const fmt = lastCall?.request.response_format as { type?: string } | undefined;
    expect(fmt?.type).toBe("json_schema");
  });

  test("request json_schema has strict: true", () => {
    const fmt = lastCall?.request.response_format as {
      type?: string;
      json_schema?: { strict?: boolean };
    } | undefined;
    expect(fmt?.json_schema?.strict).toBe(true);
  });

  test("returns a parsed object", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn).toHaveProperty("parsed");
    expect(typeof userReturn?.parsed).toBe("object");
    expect(userReturn?.parsed).not.toBeNull();
  });

  test("parsed has a name string", () => {
    const parsed = userReturn?.parsed as Record<string, unknown>;
    expect(typeof parsed?.name).toBe("string");
    expect((parsed?.name as string).length).toBeGreaterThan(0);
  });

  test("parsed has a birth_date string", () => {
    const parsed = userReturn?.parsed as Record<string, unknown>;
    expect(typeof parsed?.birth_date).toBe("string");
    expect((parsed?.birth_date as string).length).toBeGreaterThan(0);
  });

  test("parsed has a birth_city string", () => {
    const parsed = userReturn?.parsed as Record<string, unknown>;
    expect(typeof parsed?.birth_city).toBe("string");
    expect((parsed?.birth_city as string).length).toBeGreaterThan(0);
  });
});
