// Docs:
//   Grounding with Google Search : https://ai.google.dev/gemini-api/docs/grounding
//   Built-in tools               : https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools
//   groundingMetadata            : https://ai.google.dev/api/generate-content#GroundingMetadata

import { GoogleGenAI } from "@google/genai";

export interface GroundedAnswer {
  answer: string;
  /** True iff the response includes groundingMetadata (Google Search ran). */
  hasGroundingMetadata: boolean;
  /** Rough count of source URLs referenced — only meaningful when grounded. */
  sourceCount: number;
}

/**
 * TODO:
 *   Enable Google Search as a built-in tool. Unlike exercise 01 of track 03
 *   (where you declared a custom function), this tool is PROVIDED BY GOOGLE
 *   and the model calls it automatically when it needs fresh info.
 *
 *   1. Call ai.models.generateContent({
 *        model: "gemini-2.5-flash",
 *        contents: "Who won the Best Picture Oscar in 2024?",
 *        config: {
 *          tools: [{ googleSearch: {} }],   // <-- built-in tool, NOT a declaration
 *          maxOutputTokens: 400,
 *        },
 *      })
 *
 *   2. Read response.text → the natural-language answer.
 *   3. Inspect response.candidates[0].groundingMetadata:
 *        - presence of the object implies search actually happened
 *        - groundingChunks (array) contains the sources the model used
 *
 *   4. Return {
 *        answer: response.text,
 *        hasGroundingMetadata: boolean,
 *        sourceCount: number of groundingChunks (0 if absent),
 *      }
 *
 *   NOTE: you cannot combine googleSearch with user-declared functionDeclarations
 *   in the same call. Built-in tools and custom tools are MUTUALLY EXCLUSIVE per
 *   request in current Gemini API.
 */
export default async function run(): Promise<GroundedAnswer> {
  throw new Error("TODO: ground an answer with Google Search. Read exercise.md.");
}
