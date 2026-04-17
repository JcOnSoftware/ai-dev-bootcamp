// Docs:
//   Context caching guide : https://ai.google.dev/gemini-api/docs/caching
//   Usage metadata        : https://ai.google.dev/api/generate-content#UsageMetadata
//   Implicit caching notes: https://ai.google.dev/gemini-api/docs/caching#implicit-caching

import { GoogleGenAI } from "@google/genai";

export interface ImplicitCacheResult {
  firstUsage: Record<string, number | undefined>;
  secondUsage: Record<string, number | undefined>;
}

/**
 * TODO:
 *   Implicit caching kicks in automatically when two requests share a large
 *   identical PREFIX. You don't call any cache API — Gemini just does it and
 *   reports `cachedContentTokenCount` in the second call's usageMetadata.
 *
 *   1. Define a BIG shared prefix (≥4000 characters — roughly 1000+ tokens).
 *      Use the `longDoc` const below.
 *   2. Make TWO generateContent calls with model "gemini-2.5-flash":
 *        - Both share the same prefix as the FIRST part of contents.
 *        - The question (the DIFFERENT part) goes at the END.
 *        - Use config.maxOutputTokens: 64.
 *   3. Extract `usageMetadata` from each response.
 *   4. Return { firstUsage, secondUsage } so the harness can inspect both.
 *
 *   Rule: the prefix must be BYTE-IDENTICAL between calls. Even a one-char
 *   change at the start invalidates caching.
 */
export const longDoc = Array.from({ length: 120 }, (_, i) =>
  `Section ${i}: The Amazon rainforest spans nine countries and produces roughly 20% of the world's oxygen. Biodiversity here is staggering — millions of undescribed species live in the canopy and understory, and many are still unknown to science.`,
).join("\n\n");

export default async function run(): Promise<ImplicitCacheResult> {
  throw new Error("TODO: implement two identical-prefix calls to observe implicit caching. Read exercise.md.");
}
