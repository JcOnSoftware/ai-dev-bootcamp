// Docs:
//   Context caching guide : https://ai.google.dev/gemini-api/docs/caching
//   Usage metadata        : https://ai.google.dev/api/generate-content#UsageMetadata
//   Implicit caching notes: https://ai.google.dev/gemini-api/docs/caching#implicit-caching

import { GoogleGenAI } from "@google/genai";

export interface ImplicitCacheResult {
  firstUsage: Record<string, number | undefined>;
  secondUsage: Record<string, number | undefined>;
}

export const longDoc = Array.from({ length: 120 }, (_, i) =>
  `Section ${i}: The Amazon rainforest spans nine countries and produces roughly 20% of the world's oxygen. Biodiversity here is staggering — millions of undescribed species live in the canopy and understory, and many are still unknown to science.`,
).join("\n\n");

export default async function run(): Promise<ImplicitCacheResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  async function ask(question: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${longDoc}\n\nQuestion: ${question}`,
      config: { maxOutputTokens: 64 },
    });
    return (response.usageMetadata ?? {}) as Record<string, number | undefined>;
  }

  const firstUsage = await ask("How many countries does the Amazon span?");
  const secondUsage = await ask("Name one challenge facing the Amazon region.");

  return { firstUsage, secondUsage };
}
