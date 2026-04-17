// Docs:
//   Function calling guide   : https://ai.google.dev/gemini-api/docs/function-calling
//   Parallel tool calling    : https://ai.google.dev/gemini-api/docs/function-calling#parallel
//   response.functionCalls   : https://ai.google.dev/api/generate-content#GenerateContentResponse

import { GoogleGenAI, Type } from "@google/genai";

export interface ParallelResult {
  /** Names of every function Gemini decided to call in THIS single response. */
  calledFunctions: string[];
  /** The `location` argument for every get_weather call (there may be >1). */
  locations: string[];
}

/**
 * TODO:
 *   When you ask about multiple cities in one prompt, Gemini can return
 *   MULTIPLE functionCall parts in a SINGLE response — "parallel tool calling".
 *   You dispatch all of them in parallel, collect results, and feed them back
 *   together.
 *
 *   For this exercise, prove the parallel call happened:
 *     1. Declare get_weather(location: string).
 *     2. Prompt: "What's the weather in Tokyo, Buenos Aires, and Berlin?"
 *     3. Use model: "gemini-2.5-flash-lite", config.tools: [{ functionDeclarations }],
 *        config.maxOutputTokens: 256.
 *     4. Inspect response.functionCalls — it should have 3 entries (one per city).
 *     5. Extract names + locations and return them.
 */
export default async function run(): Promise<ParallelResult> {
  throw new Error("TODO: ask about three cities → expect 3 parallel tool calls. Read exercise.md.");
}
