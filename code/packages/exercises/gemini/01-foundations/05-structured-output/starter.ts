// Docs:
//   SDK README        : https://github.com/googleapis/js-genai
//   Structured output : https://ai.google.dev/gemini-api/docs/structured-output
//   Schema type enum  : https://ai.google.dev/api/caching#Schema

import { GoogleGenAI, Type } from "@google/genai";

export type Sentiment = "positive" | "negative" | "neutral";

export interface SentimentResult {
  sentiment: Sentiment;
  confidence: number; // 0..1
}

/**
 * TODO:
 *   Analyze this input text:
 *     "This new CLI tool is a lifesaver — saved me hours on the demo."
 *
 *   Configure Gemini to return a typed JSON response (not free-form text) by
 *   setting BOTH:
 *     config.responseMimeType: "application/json"
 *     config.responseSchema: { ... } — use the `Type` enum imported above.
 *
 *   Schema:
 *     - sentiment: string, one of "positive" | "negative" | "neutral"
 *     - confidence: number between 0 and 1
 *     - both fields required
 *
 *   Parse response.text as JSON and return { sentiment, confidence }.
 */
export default async function run(): Promise<SentimentResult> {
  throw new Error("TODO: implement the structured-output call. Read exercise.md for context.");
}
