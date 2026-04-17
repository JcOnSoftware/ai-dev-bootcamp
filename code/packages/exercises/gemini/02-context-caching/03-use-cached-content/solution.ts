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

export const longDoc = Array.from({ length: 200 }, (_, i) =>
  `Line ${i}: The lazy fox jumps over the quick brown dog repeatedly in section ${i} of the training corpus used to stress-test context caching.`,
).join("\n");

export default async function run(): Promise<CachedAnswer> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const cache = await ai.caches.create({
    model: "gemini-2.5-flash",
    config: {
      contents: [{ role: "user", parts: [{ text: longDoc }] }],
      systemInstruction: "You answer based only on the provided document.",
      ttl: "120s",
    },
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Write one clear sentence about the topic of the cached document.",
      config: {
        cachedContent: cache.name,
        maxOutputTokens: 80,
      },
    });

    const usage = response.usageMetadata ?? {};
    const cachedTokens = usage.cachedContentTokenCount ?? 0;
    const promptTokens = usage.promptTokenCount ?? 0;

    return {
      cacheName: cache.name ?? "",
      answer: response.text ?? "",
      cachedTokens,
      freshInputTokens: Math.max(0, promptTokens - cachedTokens),
    };
  } finally {
    // Always clean up — do not leave caches lingering (storage-per-hour billing).
    if (cache.name) {
      await ai.caches.delete({ name: cache.name });
    }
  }
}
