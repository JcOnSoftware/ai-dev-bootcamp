/**
 * Cost estimation module for the `aidev run` command.
 *
 * Provides a static price table (USD per 1,000,000 tokens) for known
 * Anthropic model families. Used as a fallback when `meta.json` does not
 * supply a `model_cost_hint`.
 */

export interface Usage {
  input_tokens: number;
  output_tokens: number;
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
 * Estimates cost for a given model + token usage.
 *
 * Returns a formatted string like `~$0.0012` when the model family is known,
 * or `null` when the model ID doesn't match any known family.
 */
export function estimateCost(model: string, usage: Usage): string | null {
  const hit = MODEL_PRICES.families.find((f) => f.match.test(model));
  if (!hit) return null;

  const cost =
    (usage.input_tokens / 1_000_000) * hit.input +
    (usage.output_tokens / 1_000_000) * hit.output;

  return `~$${cost.toFixed(4)}`;
}
