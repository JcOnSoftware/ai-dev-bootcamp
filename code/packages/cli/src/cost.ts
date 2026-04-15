/**
 * Cost estimation module for the `aidev run` command.
 *
 * Provides a static price table (USD per 1,000,000 tokens) for known
 * Anthropic model families. Used as a fallback when `meta.json` does not
 * supply a `model_cost_hint`.
 */

export interface CacheCreation {
  /** Tokens written to the 5-minute ephemeral cache tier. */
  ephemeral_5m_input_tokens?: number;
  /** Tokens written to the 1-hour ephemeral cache tier. */
  ephemeral_1h_input_tokens?: number;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  /** Tokens written to cache (any tier) on this request. SDK may return null. */
  cache_creation_input_tokens?: number | null;
  /** Tokens read from cache on this request. SDK may return null. */
  cache_read_input_tokens?: number | null;
  /** Granular breakdown by cache tier — only present on newer SDK responses. */
  cache_creation?: CacheCreation;
}

interface ModelFamily {
  match: RegExp;
  /** Input price in USD per 1,000,000 tokens. */
  input: number;
  /** Output price in USD per 1,000,000 tokens. */
  output: number;
}

export const MODEL_PRICES: { lastUpdated: string; families: ModelFamily[] } = {
  lastUpdated: "2026-04",
  families: [
    { match: /haiku/i,  input: 1.0,  output: 5.0  },
    { match: /sonnet/i, input: 3.0,  output: 15.0 },
    { match: /opus/i,   input: 15.0, output: 75.0 },
  ],
};

/**
 * Cache pricing multipliers relative to the standard input price.
 *
 * Source: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
 *   - cache read:         0.10× input price
 *   - cache write (5min): 1.25× input price  (default ephemeral TTL)
 *   - cache write (1h):   2.00× input price
 */
const CACHE_MULTIPLIERS = {
  read: 0.1,
  write5m: 1.25,
  write1h: 2.0,
} as const;

/**
 * Estimates cost for a given model + token usage.
 *
 * Returns a formatted string like `~$0.0012` when the model family is known,
 * or `null` when the model ID doesn't match any known family.
 *
 * Cache-aware: if `usage` includes cache fields, the cache read/write tokens
 * are priced at their respective multipliers instead of the standard input
 * rate. All fields are optional — existing callers work unchanged.
 *
 * Fallback rule: if `cache_creation_input_tokens > 0` but the granular
 * `cache_creation` breakdown is absent, all created tokens are attributed to
 * the 5-minute tier (cheaper, conservative estimate).
 */
export function estimateCost(model: string, usage: Usage): string | null {
  const hit = MODEL_PRICES.families.find((f) => f.match.test(model));
  if (!hit) return null;

  const inputPrice = hit.input;

  // Regular (non-cached) input tokens — SDK reports these as the residual
  // after subtracting cache tokens.
  const regularInput = usage.input_tokens;

  // Cache-read tokens (0.1× input price). Treat null as 0 (SDK may return null).
  const cacheRead = usage.cache_read_input_tokens ?? 0;

  // Cache-write tokens — split by tier when granular breakdown is available.
  let write5m = 0;
  let write1h = 0;

  if (usage.cache_creation) {
    write5m = usage.cache_creation.ephemeral_5m_input_tokens ?? 0;
    write1h = usage.cache_creation.ephemeral_1h_input_tokens ?? 0;
  } else if ((usage.cache_creation_input_tokens ?? 0) > 0) {
    // Fallback: attribute all created tokens to 5m tier. Treat null as 0.
    write5m = usage.cache_creation_input_tokens ?? 0;
  }

  const cost =
    (regularInput / 1_000_000) * inputPrice +
    (cacheRead / 1_000_000) * inputPrice * CACHE_MULTIPLIERS.read +
    (write5m / 1_000_000) * inputPrice * CACHE_MULTIPLIERS.write5m +
    (write1h / 1_000_000) * inputPrice * CACHE_MULTIPLIERS.write1h +
    (usage.output_tokens / 1_000_000) * hit.output;

  return `~$${cost.toFixed(4)}`;
}
