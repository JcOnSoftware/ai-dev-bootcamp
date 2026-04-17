// Docs:
//   Explicit caching guide       : https://ai.google.dev/gemini-api/docs/caching#explicit-caching
//   generateContent w/ cache ref : https://ai.google.dev/gemini-api/docs/caching#generate-content
//   cachedContent config field   : https://ai.google.dev/api/generate-content#generationconfig

import { GoogleGenAI } from "@google/genai";

export interface CachedAnswer {
  cacheName: string;
  answer: string;
  cachedTokens: number;
  freshInputTokens: number;
}

/**
 * TODO:
 *   1. Create a cache with ai.caches.create (same shape as exercise 02):
 *        model: "gemini-2.5-flash"
 *        config.contents: [{ role: "user", parts: [{ text: longDoc }] }]
 *        config.systemInstruction: "You answer based only on the provided document."
 *        config.ttl: "120s"
 *   2. Call ai.models.generateContent({
 *        model: "gemini-2.5-flash",
 *        contents: "Write one clear sentence about the topic of the cached document.",
 *        config: { cachedContent: cache.name, maxOutputTokens: 80 },
 *      })
 *   3. Read response.text (the answer) and response.usageMetadata (tokens).
 *   4. Clean up: ai.caches.delete({ name: cache.name })
 *   5. Return {
 *        cacheName: cache.name,
 *        answer: response.text,
 *        cachedTokens: usageMetadata.cachedContentTokenCount,  // served from cache
 *        freshInputTokens: usageMetadata.promptTokenCount - cachedContentTokenCount,
 *      }
 *
 *   `cachedContentTokenCount` being positive is the PROOF the cache was used.
 */
export const longDoc = Array.from({ length: 200 }, (_, i) =>
  `Line ${i}: The lazy fox jumps over the quick brown dog repeatedly in section ${i} of the training corpus used to stress-test context caching.`,
).join("\n");

export default async function run(): Promise<CachedAnswer> {
  throw new Error("TODO: create a cache, use it in generateContent, return usage info. Read exercise.md.");
}
