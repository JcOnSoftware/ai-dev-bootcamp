// Docs:
//   Gemini pricing           : https://ai.google.dev/pricing
//   Explicit caching guide   : https://ai.google.dev/gemini-api/docs/caching#explicit-caching
//   Usage metadata           : https://ai.google.dev/api/generate-content#UsageMetadata

import { GoogleGenAI } from "@google/genai";

export const FLASH_INPUT_PRICE_PER_M = 0.30;
export const FLASH_CACHE_READ_PRICE_PER_M = 0.075;
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

export const longDoc = Array.from({ length: 200 }, (_, i) =>
  `Line ${i}: The lazy fox jumps over the quick brown dog repeatedly in section ${i} of the training corpus used to stress-test context caching.`,
).join("\n");

const QUESTIONS = [
  "Summarize the document in one sentence.",
  "Pick one section number the document mentions.",
  "What animal is the document about?",
];

function scoreCall(usage: Record<string, number | undefined>): CallCost {
  const cachedTokens = usage["cachedContentTokenCount"] ?? 0;
  const promptTokens = usage["promptTokenCount"] ?? 0;
  const freshInputTokens = Math.max(0, promptTokens - cachedTokens);
  const outputTokens = usage["candidatesTokenCount"] ?? 0;

  const costWithCacheUSD =
    (cachedTokens / 1_000_000) * FLASH_CACHE_READ_PRICE_PER_M +
    (freshInputTokens / 1_000_000) * FLASH_INPUT_PRICE_PER_M +
    (outputTokens / 1_000_000) * FLASH_OUTPUT_PRICE_PER_M;

  const costWithoutCacheUSD =
    ((cachedTokens + freshInputTokens) / 1_000_000) * FLASH_INPUT_PRICE_PER_M +
    (outputTokens / 1_000_000) * FLASH_OUTPUT_PRICE_PER_M;

  return { cachedTokens, freshInputTokens, outputTokens, costWithCacheUSD, costWithoutCacheUSD };
}

export default async function run(): Promise<SavingsReport> {
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
    const calls: CallCost[] = [];
    for (const question of QUESTIONS) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: question,
        config: { cachedContent: cache.name, maxOutputTokens: 80 },
      });
      calls.push(scoreCall((response.usageMetadata ?? {}) as Record<string, number | undefined>));
    }

    const totalWithCacheUSD = calls.reduce((a, c) => a + c.costWithCacheUSD, 0);
    const totalWithoutCacheUSD = calls.reduce((a, c) => a + c.costWithoutCacheUSD, 0);
    const savingsUSD = totalWithoutCacheUSD - totalWithCacheUSD;
    const savingsPercent = totalWithoutCacheUSD > 0 ? (savingsUSD / totalWithoutCacheUSD) * 100 : 0;

    return {
      calls,
      totalWithCacheUSD,
      totalWithoutCacheUSD,
      savingsUSD,
      savingsPercent,
    };
  } finally {
    if (cache.name) {
      await ai.caches.delete({ name: cache.name });
    }
  }
}
