import { describe, it, expect } from "bun:test";
import { estimateCost, MODEL_PRICES, type Usage } from "./cost.ts";

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

describe("estimateCost — cache-aware", () => {
  // Haiku input price = $1.00 / 1M tokens. Makes mental math easy.
  const MODEL = "claude-haiku-4-5";

  it("backward compat: no cache fields produces same result as before", () => {
    const baseline = estimateCost(MODEL, { input_tokens: 1_000, output_tokens: 500 });
    const withEmpty = estimateCost(MODEL, {
      input_tokens: 1_000,
      output_tokens: 500,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    });
    expect(baseline).toBe(withEmpty);
  });

  it("cache read tokens: 0.1× input price", () => {
    // 1M read tokens at $1/M × 0.1 = $0.10 cost
    const result = estimateCost(MODEL, {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 1_000_000,
    });
    expect(result).not.toBeNull();
    const num = parseFloat(result!.slice(2));
    // ~$0.10 ± floating point
    expect(num).toBeCloseTo(0.1, 3);
  });

  it("cache write (5m fallback): 1.25× input price", () => {
    // 1M write tokens (5m tier) at $1/M × 1.25 = $1.25
    const result = estimateCost(MODEL, {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 1_000_000,
    });
    expect(result).not.toBeNull();
    const num = parseFloat(result!.slice(2));
    expect(num).toBeCloseTo(1.25, 3);
  });

  it("cache write (1h via granular breakdown): 2.0× input price", () => {
    // 1M write tokens (1h tier) at $1/M × 2.0 = $2.00
    const result = estimateCost(MODEL, {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation: { ephemeral_1h_input_tokens: 1_000_000 },
    });
    expect(result).not.toBeNull();
    const num = parseFloat(result!.slice(2));
    expect(num).toBeCloseTo(2.0, 3);
  });

  it("mixed: regular + 5m write + read tokens combined arithmetic", () => {
    // regular: 1000 tokens × $1/M = $0.000001 × 1000 = $0.001
    // write5m: 500 tokens × $1/M × 1.25 = $0.000000625
    // read: 2000 tokens × $1/M × 0.1 = $0.0000002
    const usage: Usage = {
      input_tokens: 1_000,
      output_tokens: 0,
      cache_creation_input_tokens: 500,
      cache_read_input_tokens: 2_000,
    };
    const result = estimateCost(MODEL, usage);
    expect(result).not.toBeNull();
    const num = parseFloat(result!.slice(2));
    // Must be strictly greater than pure input-only cost (cache write > 1×)
    const pureInput = parseFloat(estimateCost(MODEL, { input_tokens: 1_000, output_tokens: 0 })!.slice(2));
    expect(num).toBeGreaterThan(pureInput);
  });

  it("zero cache fields: same result as no cache fields at all", () => {
    const noCacheFields = estimateCost(MODEL, { input_tokens: 1_000, output_tokens: 200 });
    const zeroCacheFields = estimateCost(MODEL, {
      input_tokens: 1_000,
      output_tokens: 200,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    });
    expect(noCacheFields).toBe(zeroCacheFields);
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
