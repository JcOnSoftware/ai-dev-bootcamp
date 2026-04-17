import { describe, test, expect, beforeAll } from "bun:test";
import { runUserCode, resolveExerciseFile } from "@aidev/runner";
import type { CapturedCallGemini } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

interface TtlReport {
  cacheName: string;
  initialExpireTime: string;
  updatedExpireTime: string;
  extendedBySeconds: number;
}

describe("04-cache-ttl-update", () => {
  let calls: CapturedCallGemini[];
  let userReturn: TtlReport | undefined;

  beforeAll(async () => {
    if (!process.env["GEMINI_API_KEY"]) {
      throw new Error("GEMINI_API_KEY not set — the exercise hits the real API.");
    }
    process.env["AIDEV_PROVIDER"] = "gemini";
    const raw = await runUserCode(EXERCISE_FILE);
    calls = raw.calls as unknown as CapturedCallGemini[];
    userReturn = raw.userReturn as TtlReport | undefined;
  }, 60_000);

  test("does not call generateContent (this exercise is about cache lifecycle only)", () => {
    const generate = calls.filter(
      (c) => c.method === "generateContent" || c.method === "generateContentStream",
    );
    expect(generate).toHaveLength(0);
  });

  test("returns a cache name like cachedContents/<id>", () => {
    expect(userReturn).toBeDefined();
    expect(userReturn!.cacheName).toMatch(/^cachedContents\//);
  });

  test("both expireTime values are ISO-parseable", () => {
    const initial = new Date(userReturn!.initialExpireTime);
    const updated = new Date(userReturn!.updatedExpireTime);
    expect(Number.isNaN(initial.getTime())).toBe(false);
    expect(Number.isNaN(updated.getTime())).toBe(false);
  });

  test("updatedExpireTime is strictly AFTER initialExpireTime", () => {
    const initial = new Date(userReturn!.initialExpireTime).getTime();
    const updated = new Date(userReturn!.updatedExpireTime).getTime();
    expect(updated).toBeGreaterThan(initial);
  });

  test("extendedBySeconds is roughly the ttl delta (~540s: 600 - 60)", () => {
    // Clock skew, network RTT, and server-side quantization can shift this
    // a bit in either direction. Accept anything in a generous window.
    expect(userReturn!.extendedBySeconds).toBeGreaterThan(400);
    expect(userReturn!.extendedBySeconds).toBeLessThan(700);
  });
});
