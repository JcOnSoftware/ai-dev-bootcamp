import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface MemoryResult {
  firstAnswer: string;
  secondAnswer: string;
  totalTurns: number;
  toolsUsed: string[];
}

describe("04-agent-memory", () => {
  let calls: CapturedCallGemini[];
  let userReturn: MemoryResult | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as MemoryResult | undefined;
  }, 120_000);

  test("makes at least 4 generateContent calls (2 user turns × 2 agent turns each)", () => {
    const gen = calls.filter((c) => c.method === "generateContent");
    expect(gen.length).toBeGreaterThanOrEqual(4);
  });

  test("returns { firstAnswer, secondAnswer, totalTurns, toolsUsed }", () => {
    expect(userReturn).toBeDefined();
    expect(typeof userReturn!.firstAnswer).toBe("string");
    expect(typeof userReturn!.secondAnswer).toBe("string");
    expect(typeof userReturn!.totalTurns).toBe("number");
    expect(Array.isArray(userReturn!.toolsUsed)).toBe(true);
  });

  test("first answer contains 42 (= 6 * 7)", () => {
    expect(userReturn!.firstAnswer).toMatch(/\b42\b/);
  });

  test("second answer contains 50 (= 42 + 8)", () => {
    // This is the memory assertion — the agent remembered 42 from the first turn.
    expect(userReturn!.secondAnswer).toMatch(/\b50\b/);
  });

  test("used both tools (multiply AND add) across the conversation", () => {
    expect(userReturn!.toolsUsed).toContain("multiply");
    expect(userReturn!.toolsUsed).toContain("add");
  });

  test("the LATER generateContent call's contents include BOTH user messages", () => {
    // Inspect the FINAL captured call — its contents array should have at
    // least two `role: "user"` parts containing distinct text payloads.
    const last = calls[calls.length - 1]!;
    const contents = last.request["contents"] as Array<{ role?: string; parts?: Array<Record<string, unknown>> }>;
    const userTextMessages = (contents ?? [])
      .filter((m) => m.role === "user")
      .flatMap((m) => (m.parts ?? []).filter((p) => typeof p["text"] === "string"))
      .map((p) => String(p["text"] ?? ""));
    // The first question should still be visible in history on the later turn.
    expect(userTextMessages.some((t) => /multiply.*6.*7/i.test(t))).toBe(true);
    expect(userTextMessages.some((t) => /add.*8.*that/i.test(t))).toBe(true);
  });
});
