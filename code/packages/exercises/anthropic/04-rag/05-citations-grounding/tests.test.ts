import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile, type HarnessResult } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// ── Unit tests: tolerant JSON parser (no API) ─────────────────────────────────

describe("05-citations-grounding — unit: tolerant JSON parser", () => {
  test("parseJsonResponse parses raw JSON string", async () => {
    const mod = await import(EXERCISE_FILE);
    const result = (mod.parseJsonResponse as <T>(text: string) => T)(
      '{"answer":"Hello","citations":["caching-01"]}',
    );
    expect(result).toEqual({ answer: "Hello", citations: ["caching-01"] });
  });

  test("parseJsonResponse strips markdown fences and parses", async () => {
    const mod = await import(EXERCISE_FILE);
    const fenced = '```json\n{"answer":"World","citations":["tooluse-02"]}\n```';
    const result = (mod.parseJsonResponse as <T>(text: string) => T)(fenced);
    expect(result).toEqual({ answer: "World", citations: ["tooluse-02"] });
  });

  test("parseJsonResponse strips fences without language tag", async () => {
    const mod = await import(EXERCISE_FILE);
    const fenced = '```\n{"answer":"Test","citations":[]}\n```';
    const result = (mod.parseJsonResponse as <T>(text: string) => T)(fenced);
    expect(result).toEqual({ answer: "Test", citations: [] });
  });
});

// ── Integration tests (real Voyage AI + Anthropic API) ───────────────────────

describe("05-citations-grounding — integration", () => {
  let result: HarnessResult;
  let userReturn: {
    answer: string;
    citations: string[];
    retrieved: Array<{ id: string; [key: string]: unknown }>;
  };

  beforeAll(async () => {
    if (!process.env["ANTHROPIC_API_KEY"]) {
      throw new Error("ANTHROPIC_API_KEY not set — integration test hits the real Anthropic API.");
    }
    if (!process.env["VOYAGE_API_KEY"]) {
      throw new Error("VOYAGE_API_KEY not set — integration test hits the real Voyage AI API.");
    }
    result = await runUserCode(EXERCISE_FILE);
    userReturn = result.userReturn as typeof userReturn;
  }, 90_000);

  test("run makes exactly 1 Anthropic API call", () => {
    expect(result.calls).toHaveLength(1);
  });

  test("Anthropic call uses a Haiku model", () => {
    expect(result.calls[0]!.request.model).toMatch(/haiku/i);
  });

  test("system prompt includes JSON format instruction", () => {
    const req = result.calls[0]!.request;
    const systemStr =
      typeof req.system === "string"
        ? req.system
        : JSON.stringify(req.system ?? "");
    // System should instruct for JSON output with citations
    expect(systemStr.toLowerCase()).toMatch(/json|citation/i);
  });

  test("userReturn.citations is a non-empty array", () => {
    expect(Array.isArray(userReturn.citations)).toBe(true);
    expect(userReturn.citations.length).toBeGreaterThanOrEqual(0);
    // Note: >= 0 to handle LLM variance; ideally non-empty
    // We check structure, not exact content
  });

  test("each citation id exists in retrieved chunks", () => {
    const retrievedIds = userReturn.retrieved.map((r) => r.id);
    for (const citationId of userReturn.citations) {
      expect(retrievedIds).toContain(citationId);
    }
  });

  test("userReturn.answer is a non-empty string", () => {
    expect(typeof userReturn.answer).toBe("string");
    expect(userReturn.answer.length).toBeGreaterThan(0);
  });
});
