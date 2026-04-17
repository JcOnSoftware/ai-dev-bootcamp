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

export const longDoc = Array.from({ length: 200 }, (_, i) =>
  `Line ${i}: The lazy fox jumps over the quick brown dog repeatedly in section ${i} of the training corpus used to stress-test context caching.`,
).join("\n");

export default async function run(): Promise<TtlReport> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const cache = await ai.caches.create({
    model: "gemini-2.5-flash",
    config: {
      contents: [{ role: "user", parts: [{ text: longDoc }] }],
      systemInstruction: "You answer based only on the provided document.",
      ttl: "60s",
    },
  });

  const initialExpireTime = cache.expireTime ?? "";

  try {
    const updated = await ai.caches.update({
      name: cache.name!,
      config: { ttl: "600s" },
    });

    const updatedExpireTime = updated.expireTime ?? "";
    const extendedBySeconds = Math.round(
      (new Date(updatedExpireTime).getTime() - new Date(initialExpireTime).getTime()) / 1000,
    );

    return {
      cacheName: cache.name ?? "",
      initialExpireTime,
      updatedExpireTime,
      extendedBySeconds,
    };
  } finally {
    if (cache.name) {
      await ai.caches.delete({ name: cache.name });
    }
  }
}
