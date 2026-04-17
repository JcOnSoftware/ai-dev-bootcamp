// Docs:
//   Gemini pricing           : https://ai.google.dev/pricing
//   Explicit caching guide   : https://ai.google.dev/gemini-api/docs/caching#explicit-caching
//   Usage metadata           : https://ai.google.dev/api/generate-content#UsageMetadata

import { GoogleGenAI } from "@google/genai";

/** Per-1M-token rates for gemini-2.5-flash (as of 2026-04, paid tier). */
export const FLASH_INPUT_PRICE_PER_M = 0.30;
export const FLASH_CACHE_READ_PRICE_PER_M = 0.075; // 25% of input
export const FLASH_OUTPUT_PRICE_PER_M = 2.50;

export interface CallCost {
  cachedTokens: number;
  freshInputTokens: number;
  outputTokens: number;
  costWithCacheUSD: number;
  costWithoutCacheUSD: number;
}

export interface SavingsReport {
  calls: CallCost[];
  totalWithCacheUSD: number;
  totalWithoutCacheUSD: number;
  savingsUSD: number;
  savingsPercent: number;
}

/**
 * TODO:
 *   1. Create a cache for `longDoc` (ttl: "120s").
 *   2. Ask the model THREE different questions against the SAME cache.
 *      Suggested: short factual questions that don't need long answers.
 *      Use config.maxOutputTokens: 80.
 *   3. For each call, extract from usageMetadata:
 *        cachedTokens     = cachedContentTokenCount
 *        freshInputTokens = promptTokenCount - cachedContentTokenCount
 *        outputTokens     = candidatesTokenCount
 *      and compute:
 *        costWithCacheUSD    = cachedTokens * 0.075/M + freshInputTokens * 0.30/M + outputTokens * 2.50/M
 *        costWithoutCacheUSD = (cachedTokens + freshInputTokens) * 0.30/M + outputTokens * 2.50/M
 *   4. Sum totals across the 3 calls.
 *   5. Delete the cache in a finally block.
 *   6. Return the full report.
 *
 *   With a ~5000-token cached doc, each call typically saves ~$0.001. Small
 *   per call — but at 100k calls/day that's $100/day. Caching matters at scale.
 */
export const longDoc = Array.from({ length: 200 }, (_, i) =>
  `Line ${i}: The lazy fox jumps over the quick brown dog repeatedly in section ${i} of the training corpus used to stress-test context caching.`,
).join("\n");

export default async function run(): Promise<SavingsReport> {
  throw new Error("TODO: cache + 3 calls + compute savings report. Read exercise.md for context.");
}
