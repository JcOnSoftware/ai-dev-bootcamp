// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Cache pricing details: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#pricing
//   Messages API reference: https://docs.claude.com/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import { estimateCost, type Usage } from "../../../cli/src/cost.ts";
import { LONG_SYSTEM_PROMPT } from "../fixtures/long-system-prompt.ts";

const client = new Anthropic();

export interface CacheUsage {
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  input_tokens: number;
  output_tokens: number;
}

export interface CacheStats {
  /** Tokens read from cache (0.1x price). */
  cached: number;
  /** Tokens written to cache (1.25x price). */
  created: number;
  /** Regular (non-cached) input tokens (1.0x price). */
  regular: number;
  /** Percentage savings vs. paying full input price for all tokens. */
  savings_pct: number;
  /** Actual cost in USD using cache-aware pricing. */
  effective_cost_usd: number;
}

const MODEL = "claude-haiku-4-5-20251001";

/**
 * Compute cache statistics and effective cost for a single API usage object.
 *
 * Savings percentage formula:
 *   hypothetical_cost = (cached + created + regular) tokens × input_price
 *   actual_cost = effective_cost_usd (from estimateCost with cache multipliers)
 *   savings_pct = ((hypothetical_cost - actual_cost) / hypothetical_cost) × 100
 */
export function cacheStats(usage: CacheUsage): CacheStats {
  const cached = usage.cache_read_input_tokens ?? 0;
  const created = usage.cache_creation_input_tokens ?? 0;
  const regular = usage.input_tokens;

  // Effective (actual) cost using cache-aware pricing from cost.ts.
  const costStr = estimateCost(MODEL, usage as Usage);
  const effective_cost_usd = costStr ? parseFloat(costStr.slice(2)) : 0;

  // Hypothetical cost: all tokens at full input price (no cache).
  // Haiku input price: $1.00 / 1M tokens.
  const INPUT_PRICE_PER_TOKEN = 1.0 / 1_000_000;
  const total_tokens = cached + created + regular;
  const hypothetical_cost = total_tokens * INPUT_PRICE_PER_TOKEN;

  const savings_pct =
    hypothetical_cost > 0
      ? Math.max(0, ((hypothetical_cost - effective_cost_usd) / hypothetical_cost) * 100)
      : 0;

  return { cached, created, regular, savings_pct, effective_cost_usd };
}

/**
 * Solution: Two calls with a cached system prompt. Returns cacheStats on the
 * second call's usage to show real savings.
 */
export default async function run(): Promise<CacheStats> {
  const systemBlock: Anthropic.TextBlockParam & {
    cache_control: { type: "ephemeral" };
  } = {
    type: "text",
    text: LONG_SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" },
  };

  const userMessage = "What is the purpose of ETags in REST API caching?";

  // Call 1: warms the cache (or reads from an already-warm cache).
  await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: [systemBlock],
    messages: [{ role: "user", content: userMessage }],
  });

  // Call 2: reads from cache — usage shows cache_read_input_tokens > 0.
  const response2 = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: [systemBlock],
    messages: [{ role: "user", content: userMessage }],
  });

  return cacheStats(response2.usage as CacheUsage);
}
