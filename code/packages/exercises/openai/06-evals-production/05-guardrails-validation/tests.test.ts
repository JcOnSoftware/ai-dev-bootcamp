import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallOpenAI } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface GuardrailResult {
  prompt: string;
  inputBlocked: boolean;
  outputFlagged: boolean;
  response: string | null;
}

describe("05-guardrails-validation", () => {
  let calls: CapturedCallOpenAI[];
  let lastCall: CapturedCallOpenAI | undefined;
  let userReturn: { results: GuardrailResult[] } | undefined;

  beforeAll(async () => {
    if (!process.env["OPENAI_API_KEY"]) {
      throw new Error("OPENAI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "openai";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallOpenAI[];
    lastCall = calls[calls.length - 1];
    userReturn = raw.userReturn as { results: GuardrailResult[] } | undefined;
  }, 60_000);

  test("returns results array with 3 entries", () => {
    expect(userReturn).toBeDefined();
    expect(Array.isArray(userReturn?.results)).toBe(true);
    expect(userReturn?.results).toHaveLength(3);
  });

  test("each result has required fields with correct types", () => {
    for (const result of userReturn?.results ?? []) {
      expect(typeof result.prompt).toBe("string");
      expect(typeof result.inputBlocked).toBe("boolean");
      expect(typeof result.outputFlagged).toBe("boolean");
      // response is string or null
      expect(result.response === null || typeof result.response === "string").toBe(true);
    }
  });

  test("at least one result has inputBlocked: true (the injection prompt)", () => {
    const blocked = userReturn?.results.filter((r) => r.inputBlocked === true) ?? [];
    expect(blocked.length).toBeGreaterThanOrEqual(1);
  });

  test("blocked results have response: null", () => {
    const blocked = userReturn?.results.filter((r) => r.inputBlocked === true) ?? [];
    for (const result of blocked) {
      expect(result.response).toBeNull();
    }
  });

  test("at least one non-blocked result has a non-null response string", () => {
    const notBlocked = userReturn?.results.filter((r) => r.inputBlocked === false) ?? [];
    const withResponse = notBlocked.filter((r) => typeof r.response === "string" && r.response.length > 0);
    expect(withResponse.length).toBeGreaterThanOrEqual(1);
  });

  test("fewer API calls than total prompts (blocked prompts skip the API)", () => {
    // We have 3 prompts but at least 1 is blocked, so fewer than 3 calls
    expect(calls.length).toBeLessThan(3);
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });
});
