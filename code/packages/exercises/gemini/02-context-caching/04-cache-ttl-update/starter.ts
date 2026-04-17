// Docs:
//   Explicit caching guide : https://ai.google.dev/gemini-api/docs/caching#explicit-caching
//   caches.update reference: https://ai.google.dev/api/caching#method:-cachedcontents.patch
//   CachedContent resource : https://ai.google.dev/api/caching#CachedContent

import { GoogleGenAI } from "@google/genai";

export interface TtlReport {
  cacheName: string;
  initialExpireTime: string;
  updatedExpireTime: string;
  extendedBySeconds: number;
}

/**
 * TODO:
 *   1. Create a cache with ttl: "60s".
 *   2. Save cache.expireTime as initialExpireTime (it's an ISO string).
 *   3. Call ai.caches.update({
 *        name: cache.name,
 *        config: { ttl: "600s" },
 *      })
 *      — this bumps the cache's expiration 10 minutes into the future.
 *   4. Save updated.expireTime as updatedExpireTime.
 *   5. Compute extendedBySeconds = difference in seconds between the two
 *      expireTime values (parse via Date).
 *   6. Delete the cache and return the report.
 *
 *   Why this matters in production: instead of creating a fresh cache every
 *   N minutes you extend the existing one — no re-upload, same `cachedContents/<id>`
 *   reference everywhere in your app.
 */
export const longDoc = Array.from({ length: 200 }, (_, i) =>
  `Line ${i}: The lazy fox jumps over the quick brown dog repeatedly in section ${i} of the training corpus used to stress-test context caching.`,
).join("\n");

export default async function run(): Promise<TtlReport> {
  throw new Error("TODO: create a cache, extend TTL with caches.update, report expireTime delta. Read exercise.md.");
}
