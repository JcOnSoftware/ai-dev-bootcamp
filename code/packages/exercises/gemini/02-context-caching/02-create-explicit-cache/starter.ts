// Docs:
//   Explicit caching guide : https://ai.google.dev/gemini-api/docs/caching#explicit-caching
//   caches.create reference: https://ai.google.dev/api/caching#method:-cachedcontents.create
//   CachedContent resource : https://ai.google.dev/api/caching#CachedContent

import { GoogleGenAI } from "@google/genai";

export interface CacheCreated {
  name: string;
  model: string;
  displayName?: string;
  hasExpireTime: boolean;
  /** Tokens stored in the cache (usageMetadata.totalTokenCount at creation). */
  tokensCached: number;
}

/**
 * TODO:
 *   Create an explicit cache for the document below, then return its
 *   metadata. You do NOT need to call generateContent here — exercise 03
 *   covers using the cache.
 *
 *   1. Instantiate GoogleGenAI.
 *   2. Call ai.caches.create({
 *        model: "gemini-2.5-flash",
 *        config: {
 *          contents: [{ role: "user", parts: [{ text: longDoc }] }],
 *          systemInstruction: "You answer based only on the provided document.",
 *          ttl: "300s",
 *          displayName: "amazon-doc-cache",
 *        },
 *      })
 *   3. Clean up IMMEDIATELY with ai.caches.delete({ name: cache.name }) AFTER
 *      extracting the metadata you need. (Caches cost storage tokens/hour.)
 *   4. Return { name, model, displayName, hasExpireTime, tokensCached }.
 *
 *   Explicit caching REQUIRES paid tier — free tier has limit=0 for
 *   cached-content storage and will 429 on create.
 */
export const longDoc = Array.from({ length: 200 }, (_, i) =>
  `Line ${i}: The lazy fox jumps over the quick brown dog repeatedly in section ${i} of the training corpus used to stress-test context caching.`,
).join("\n");

export default async function run(): Promise<CacheCreated> {
  throw new Error("TODO: create an explicit cache, return its metadata, then delete. Read exercise.md.");
}
