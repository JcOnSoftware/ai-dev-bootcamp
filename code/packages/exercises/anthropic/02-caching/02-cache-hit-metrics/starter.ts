// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Cache pricing details: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#pricing
//   Messages API reference: https://docs.claude.com/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import { estimateCost, type Usage } from "../../../../cli/src/cost.ts";
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

/**
 * Compute cache statistics and effective cost for a single API usage object.
 *
 * @param usage - The usage object from a cached API response.
 * @param model - Model id (e.g. "claude-haiku-4-5-20251001"); used by
 *                estimateCost to look up input/output pricing.
 * @returns CacheStats with savings percentage and effective USD cost.
 *
 * Hint: use estimateCost(model, usage) to get the cost string
 * (format "~$0.0012"), then parseFloat(cost.slice(2)) to get a number.
 */
export function cacheStats(_usage: CacheUsage, _model: string): CacheStats {
  // TODO: implement cacheStats
  throw new Error("TODO: implement cacheStats()");
}

/**
 * Exercise 02-cache-hit-metrics
 *
 * Task:
 * 1. Make 2 calls using LONG_SYSTEM_PROMPT as a cached system block.
 * 2. Call cacheStats() on the second call's usage object.
 * 3. Return the CacheStats result.
 */
export default async function run(): Promise<CacheStats> {
  // TODO: implement run()
  throw new Error("TODO: implement run()");
}
