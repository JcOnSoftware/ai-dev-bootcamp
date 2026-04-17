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
  tokensCached: number;
}

export const longDoc = Array.from({ length: 200 }, (_, i) =>
  `Line ${i}: The lazy fox jumps over the quick brown dog repeatedly in section ${i} of the training corpus used to stress-test context caching.`,
).join("\n");

export default async function run(): Promise<CacheCreated> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const cache = await ai.caches.create({
    model: "gemini-2.5-flash",
    config: {
      contents: [{ role: "user", parts: [{ text: longDoc }] }],
      systemInstruction: "You answer based only on the provided document.",
      ttl: "300s",
      displayName: "amazon-doc-cache",
    },
  });

  const result: CacheCreated = {
    name: cache.name ?? "",
    model: cache.model ?? "",
    displayName: cache.displayName,
    hasExpireTime: typeof cache.expireTime === "string" && cache.expireTime.length > 0,
    tokensCached: cache.usageMetadata?.totalTokenCount ?? 0,
  };

  // Always clean up — caches cost storage tokens/hour.
  await ai.caches.delete({ name: cache.name! });

  return result;
}
