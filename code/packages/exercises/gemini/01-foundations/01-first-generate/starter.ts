// Docs:
//   SDK README  : https://github.com/googleapis/js-genai
//   API ref     : https://ai.google.dev/api/generate-content
//   Model IDs   : https://ai.google.dev/gemini-api/docs/models

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

/**
 * TODO:
 *   1. Create a GoogleGenAI client — pass { apiKey: process.env.GEMINI_API_KEY }.
 *   2. Call ai.models.generateContent with:
 *        - model: "gemini-2.5-flash-lite" (cheapest tier)
 *        - contents: "Say hello briefly in Spanish, one short sentence."
 *        - config: { maxOutputTokens: 128 }
 *   3. Return the response object.
 *
 * If you get stuck, read exercise.md (section "Docs & references") or hover
 * over `ai.models.generateContent` in your editor to see the full signature.
 */
export default async function run(): Promise<GenerateContentResponse> {
  throw new Error("TODO: implement the Gemini generateContent call. Read exercise.md for context.");
}
