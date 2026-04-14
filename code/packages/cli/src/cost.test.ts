import { describe, it, expect } from "bun:test";
import { estimateCost, MODEL_PRICES } from "./cost.ts";

describe("estimateCost", () => {
  it("returns a numeric string for a known Haiku model", () => {
    // claude-haiku-4-5 → haiku family match
    const result = estimateCost("claude-haiku-4-5", {
      input_tokens: 1_000,
      output_tokens: 500,
    });
    expect(result).not.toBeNull();
    // starts with ~$
    expect(result!.startsWith("~$")).toBe(true);
    // numeric after ~$
    const num = parseFloat(result!.slice(2));
    expect(isNaN(num)).toBe(false);
    expect(num).toBeGreaterThan(0);
  });

  it("returns a numeric string for a known Sonnet model", () => {
    const result = estimateCost("claude-sonnet-4-5", {
      input_tokens: 1_000,
      output_tokens: 500,
    });
    expect(result).not.toBeNull();
    // Sonnet costs more than Haiku for same tokens
    const haiku = estimateCost("claude-haiku-4-5", { input_tokens: 1_000, output_tokens: 500 });
    expect(parseFloat(result!.slice(2))).toBeGreaterThan(parseFloat(haiku!.slice(2)));
  });

  it("returns a numeric string for a known Opus model", () => {
    const result = estimateCost("claude-opus-4-5", {
      input_tokens: 1_000,
      output_tokens: 500,
    });
    expect(result).not.toBeNull();
    // Opus costs more than Sonnet for same tokens
    const sonnet = estimateCost("claude-sonnet-4-5", { input_tokens: 1_000, output_tokens: 500 });
    expect(parseFloat(result!.slice(2))).toBeGreaterThan(parseFloat(sonnet!.slice(2)));
  });

  it("returns null for an unknown model", () => {
    const result = estimateCost("gpt-9000-turbo", {
      input_tokens: 1_000,
      output_tokens: 500,
    });
    expect(result).toBeNull();
  });

  it("returns ~$0.0000 for zero tokens", () => {
    const result = estimateCost("claude-haiku-4-5", {
      input_tokens: 0,
      output_tokens: 0,
    });
    expect(result).toBe("~$0.0000");
  });

  it("is case-insensitive for model matching (HAIKU uppercase)", () => {
    const result = estimateCost("CLAUDE-HAIKU-4-5", {
      input_tokens: 1_000,
      output_tokens: 500,
    });
    expect(result).not.toBeNull();
  });
});

describe("MODEL_PRICES", () => {
  it("has a lastUpdated field", () => {
    expect(typeof MODEL_PRICES.lastUpdated).toBe("string");
    expect(MODEL_PRICES.lastUpdated.length).toBeGreaterThan(0);
  });

  it("has families array with haiku, sonnet, opus entries", () => {
    const names = MODEL_PRICES.families.map((f) => f.match.source);
    expect(names.some((n) => /haiku/i.test(n))).toBe(true);
    expect(names.some((n) => /sonnet/i.test(n))).toBe(true);
    expect(names.some((n) => /opus/i.test(n))).toBe(true);
  });
});
