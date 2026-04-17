// Docs:
//   SDK README    : https://github.com/googleapis/js-genai
//   Usage metadata: https://ai.google.dev/api/generate-content#UsageMetadata
//   Pricing       : https://ai.google.dev/pricing

import { GoogleGenAI } from "@google/genai";

export interface UsageReport {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** Estimated cost in USD using gemini-2.5-flash-lite rates ($0.10 in / $0.40 out per 1M). */
  estimatedCostUSD: number;
}

/**
 * TODO:
 *   1. Call ai.models.generateContent({
 *        model: "gemini-2.5-flash-lite",
 *        contents: "Summarize the plot of Romeo and Juliet in 3 sentences.",
 *        config: { maxOutputTokens: 256 },
 *      })
 *   2. Read `response.usageMetadata` — fields are camelCase:
 *        - promptTokenCount      (input tokens)
 *        - candidatesTokenCount  (output tokens)
 *        - totalTokenCount       (input + output)
 *   3. Compute estimatedCostUSD using flash-lite rates:
 *        input  = $0.10 per 1M tokens
 *        output = $0.40 per 1M tokens
 *   4. Return { inputTokens, outputTokens, totalTokens, estimatedCostUSD }.
 */
export default async function run(): Promise<UsageReport> {
  throw new Error("TODO: implement the usage + cost report. Read exercise.md for context.");
}
