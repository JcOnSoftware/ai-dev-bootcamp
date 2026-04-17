// Docs:
//   SDK README    : https://github.com/googleapis/js-genai
//   Usage metadata: https://ai.google.dev/api/generate-content#UsageMetadata
//   Pricing       : https://ai.google.dev/pricing

import { GoogleGenAI } from "@google/genai";

export interface UsageReport {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

const INPUT_PRICE_PER_MILLION = 0.10;
const OUTPUT_PRICE_PER_MILLION = 0.40;

export default async function run(): Promise<UsageReport> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Summarize the plot of Romeo and Juliet in 3 sentences.",
    config: { maxOutputTokens: 256 },
  });

  const usage = response.usageMetadata ?? {};
  const inputTokens = usage.promptTokenCount ?? 0;
  const outputTokens = usage.candidatesTokenCount ?? 0;
  const totalTokens = usage.totalTokenCount ?? inputTokens + outputTokens;

  const estimatedCostUSD =
    (inputTokens / 1_000_000) * INPUT_PRICE_PER_MILLION +
    (outputTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;

  return { inputTokens, outputTokens, totalTokens, estimatedCostUSD };
}
