import { describe, test, expect } from "bun:test";
import { resolveExerciseFile } from "@aidev/runner";

const EXERCISE_FILE = resolveExerciseFile(import.meta.url);

// ── Unit tests only — no API calls, no beforeAll guard ───────────────────────
// This exercise teaches pure computation — chunking has zero API cost.

describe("03-chunking-strategies — unit", () => {
  test("chunk('', ...) returns empty array", async () => {
    const mod = await import(EXERCISE_FILE);
    const result = (mod.chunk as (text: string, options: { size: number; overlap: number }) => string[])("", { size: 100, overlap: 0 });
    expect(result).toEqual([]);
  });

  test("text shorter than size returns a single chunk", async () => {
    const mod = await import(EXERCISE_FILE);
    const result = (mod.chunk as (text: string, options: { size: number; overlap: number }) => string[])("hello world", { size: 100, overlap: 0 });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("hello world");
  });

  test("text exactly equal to size returns a single chunk", async () => {
    const mod = await import(EXERCISE_FILE);
    const text = "a".repeat(50);
    const result = (mod.chunk as (text: string, options: { size: number; overlap: number }) => string[])(text, { size: 50, overlap: 0 });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  test("text larger than size splits into multiple chunks without overlap", async () => {
    const mod = await import(EXERCISE_FILE);
    const text = "a".repeat(100);
    const result = (mod.chunk as (text: string, options: { size: number; overlap: number }) => string[])(text, { size: 40, overlap: 0 });
    expect(result.length).toBeGreaterThan(1);
    // All chars covered
    expect(result.join("")).toBe(text);
  });

  test("overlap produces sliding windows with shared content", async () => {
    const mod = await import(EXERCISE_FILE);
    const text = "abcdefghijklmnopqrstuvwxyz"; // 26 chars
    const result = (mod.chunk as (text: string, options: { size: number; overlap: number }) => string[])(text, { size: 10, overlap: 5 });
    // With size=10, overlap=5: step = 5
    // chunk[0]: chars 0-9  = "abcdefghij"
    // chunk[1]: chars 5-14 = "fghijklmno"
    // Consecutive chunks share overlap chars
    expect(result.length).toBeGreaterThan(1);
    const c0 = result[0]!;
    const c1 = result[1]!;
    // Last 5 chars of c0 should equal first 5 chars of c1
    const tail = c0.slice(c0.length - 5);
    const head = c1.slice(0, 5);
    expect(tail).toBe(head);
  });

  test("run() returns object with fixed, sentence, paragraph arrays all non-empty", async () => {
    const mod = await import(EXERCISE_FILE);
    const result = (await (mod.default as () => Promise<{ fixed: string[]; sentence: string[]; paragraph: string[] }>)());
    expect(result).toHaveProperty("fixed");
    expect(result).toHaveProperty("sentence");
    expect(result).toHaveProperty("paragraph");
    expect(Array.isArray(result.fixed)).toBe(true);
    expect(Array.isArray(result.sentence)).toBe(true);
    expect(Array.isArray(result.paragraph)).toBe(true);
    expect(result.fixed.length).toBeGreaterThan(0);
    expect(result.sentence.length).toBeGreaterThan(0);
    expect(result.paragraph.length).toBeGreaterThan(0);
  });
});
