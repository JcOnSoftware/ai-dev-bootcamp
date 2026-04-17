// Docs:
//   SDK README  : https://github.com/googleapis/js-genai
//   Models list : https://ai.google.dev/gemini-api/docs/models
//   Pricing     : https://ai.google.dev/pricing

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

/**
 * TODO:
 *   Make TWO calls with the SAME prompt but DIFFERENT models so you can
 *   compare cost vs quality yourself:
 *     - "gemini-2.5-flash-lite"  → cheapest ($0.10 / $0.40 per 1M)
 *     - "gemini-2.5-flash"        → balanced ($0.30 / $2.50 per 1M)
 *
 *   Use prompt: "Explain what an API is in one sentence."
 *   Cap responses with config.maxOutputTokens: 128.
 *   Return both responses as { flashLite, flash }.
 */
export default async function run(): Promise<{
  flashLite: GenerateContentResponse;
  flash: GenerateContentResponse;
}> {
  throw new Error("TODO: implement two generateContent calls with different models. Read exercise.md.");
}
