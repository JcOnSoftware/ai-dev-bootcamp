// Docs:
//   Safety settings guide : https://ai.google.dev/gemini-api/docs/safety-settings
//   HarmCategory enum     : https://ai.google.dev/api/generate-content#HarmCategory
//   Threshold enum        : https://ai.google.dev/api/generate-content#HarmBlockThreshold

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

export interface SafetyResult {
  answer: string;
  finishReason: string;
  /** Which HarmCategory values were explicitly configured on the request. */
  configuredCategories: string[];
}

/**
 * TODO:
 *   Every Gemini request can carry a list of `safetySettings` — one entry per
 *   HarmCategory you care about. Each entry sets a threshold for when the
 *   model should BLOCK a response.
 *
 *   For learning, configure a safety rule set that explicitly addresses
 *   FOUR HarmCategories, all with the default production threshold
 *   (`BLOCK_MEDIUM_AND_ABOVE`). The exact shape:
 *
 *     [
 *       { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
 *       { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
 *       { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
 *       { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
 *     ]
 *
 *   1. Call generateContent with:
 *        model: "gemini-2.5-flash-lite"
 *        contents: "Tell me a harmless one-sentence joke about programmers."
 *        config.safetySettings: <the list above>
 *        config.maxOutputTokens: 128
 *
 *   2. Read response.text and response.candidates[0].finishReason.
 *
 *   3. Return:
 *        answer: response.text ?? "",
 *        finishReason: candidates[0].finishReason ?? "",
 *        configuredCategories: array of the HarmCategory strings from your config.
 */
export default async function run(): Promise<SafetyResult> {
  throw new Error("TODO: configure safety settings on a request. Read exercise.md.");
}
