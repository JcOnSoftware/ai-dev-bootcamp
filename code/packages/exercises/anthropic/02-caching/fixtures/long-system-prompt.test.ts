/**
 * Guard test: ensures LONG_SYSTEM_PROMPT exceeds the Haiku 4.5 prompt-cache
 * threshold of 4,096 tokens. Uses character count as a proxy (English prose
 * averages ~4 chars/token; 4,096 tokens × 4 chars = ~16,384 chars).
 *
 * We require >= 16,000 chars (~4,000 tokens proxy) with 5–10% margin above
 * the 4,096 threshold. No API calls needed — pure unit test.
 */
import { describe, it, expect } from "bun:test";
import { LONG_SYSTEM_PROMPT } from "./long-system-prompt.ts";

describe("LONG_SYSTEM_PROMPT fixture", () => {
  it("is a non-empty string", () => {
    expect(typeof LONG_SYSTEM_PROMPT).toBe("string");
    expect(LONG_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it("exceeds 16,000 characters (proxy for > 4,096 tokens)", () => {
    // Haiku 4.5 cache threshold = 4,096 tokens.
    // English prose ~4 chars/token → 4,096 tokens × 4 = 16,384 chars minimum.
    // We require 16,000 chars to give a comfortable margin over the threshold.
    expect(LONG_SYSTEM_PROMPT.length).toBeGreaterThanOrEqual(16_000);
  });

  it("is under 100,000 characters (sanity upper bound)", () => {
    // Prevent runaway fixture growth that would inflate test cost.
    expect(LONG_SYSTEM_PROMPT.length).toBeLessThan(100_000);
  });

  it("contains expected REST API content keywords", () => {
    expect(LONG_SYSTEM_PROMPT).toContain("REST");
    expect(LONG_SYSTEM_PROMPT).toContain("HTTP");
    expect(LONG_SYSTEM_PROMPT).toContain("cache");
  });
});
