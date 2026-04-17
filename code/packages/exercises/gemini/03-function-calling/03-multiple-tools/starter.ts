// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   FunctionDeclaration    : https://ai.google.dev/api/caching#FunctionDeclaration

import { GoogleGenAI, Type } from "@google/genai";

export interface RouterResult {
  chosenFunction: string;
  chosenArgs: Record<string, unknown>;
}

/**
 * TODO:
 *   Declare TWO functions and let the model route the user's question:
 *     - get_weather(location: string) — weather
 *     - get_news_headlines(topic: string, max?: integer) — recent headlines
 *
 *   Call generateContent with:
 *     model: "gemini-2.5-flash-lite"
 *     contents: "Give me three recent headlines about AI research."
 *     config.tools: [{ functionDeclarations: [weatherDecl, newsDecl] }]
 *     config.maxOutputTokens: 256
 *
 *   The model should pick get_news_headlines — news prompt, not weather.
 *   Read response.functionCalls[0] and return { chosenFunction, chosenArgs }.
 */
export default async function run(): Promise<RouterResult> {
  throw new Error("TODO: declare two tools and let the model route. Read exercise.md.");
}
