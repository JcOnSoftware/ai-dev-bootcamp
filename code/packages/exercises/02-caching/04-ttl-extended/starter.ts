// Docs:
//   Prompt caching guide: https://docs.claude.com/en/docs/build-with-claude/prompt-caching
//   Extended TTL (1h): https://docs.claude.com/en/docs/build-with-claude/prompt-caching#extended-cache-ttl
//   Cache pricing: https://docs.claude.com/en/docs/build-with-claude/prompt-caching#pricing

import Anthropic from "@anthropic-ai/sdk";
import { LONG_SYSTEM_PROMPT } from "../fixtures/long-system-prompt.ts";

const client = new Anthropic();

/**
 * Calculate the minimum number of cache reads needed for the 1-hour TTL
 * to be cheaper than repeatedly writing with the default 5-minute TTL.
 *
 * Formula (pinned):
 *   N > (write1h - write5m) / (write5m - read)
 *   result = Math.ceil(N + epsilon)  →  Math.ceil(that value) if not integer
 *
 * Multipliers:
 *   read   = 0.1x input price
 *   write5m = 1.25x input price
 *   write1h = 2.0x input price
 *
 * Note: cacheTokens and pricePerMillion cancel out — the ratio is fixed at
 * (2.0 - 1.25) / (1.25 - 0.1) = 0.75 / 1.15 ≈ 0.652
 * So Math.ceil(0.652) = 1: after just 1 read, the 1h write pays for itself.
 *
 * @param cacheTokens - Number of tokens being cached (kept for API symmetry).
 * @param pricePerMillion - Input price per 1M tokens in USD (kept for API symmetry).
 * @returns Minimum integer number of reads for 1h TTL to break even vs 5m TTL.
 */
export function breakEvenCalls(_cacheTokens: number, _pricePerMillion: number): number {
  // TODO: implement breakEvenCalls
  throw new Error("TODO: implement breakEvenCalls()");
}

/**
 * Exercise 04-ttl-extended
 *
 * Task:
 * 1. Make 2 calls using cache_control: { type: "ephemeral", ttl: "1h" } on the system block.
 * 2. Return both responses.
 *
 * The 1h TTL writes cost 2.0x the input price (vs 1.25x for 5m default).
 * Use breakEvenCalls to show users when it's worth paying the premium.
 */
export default async function run() {
  // TODO: implement run()
  throw new Error("TODO: implement run()");
}
