// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   FunctionDeclaration    : https://ai.google.dev/api/caching#FunctionDeclaration
//   Schema type enum       : https://ai.google.dev/api/caching#Schema

import { GoogleGenAI, Type } from "@google/genai";

export interface FirstToolResult {
  /** name of the function Gemini wanted to call */
  calledFunction: string;
  /** args Gemini generated for the call (parsed JSON) */
  calledArgs: Record<string, unknown>;
}

/**
 * TODO:
 *   1. Declare a function `get_current_weather` with ONE required string
 *      parameter: `location`. Use the `Type` enum for the schema.
 *   2. Pass the declaration via config.tools:
 *        tools: [{ functionDeclarations: [yourDecl] }]
 *   3. Call generateContent with:
 *        model: "gemini-2.5-flash-lite"
 *        contents: "What's the weather in Tokyo right now?"
 *        config: { tools: [...], maxOutputTokens: 256 }
 *   4. Read the FIRST item in response.functionCalls (the SDK convenience
 *      getter that collects all functionCall parts across candidates).
 *   5. Return { calledFunction, calledArgs }.
 *
 *   You do NOT execute the function here — that's exercise 02. This exercise
 *   proves the model ASKED to call it.
 */
export default async function run(): Promise<FirstToolResult> {
  throw new Error("TODO: declare a weather tool and return the function call the model requested. Read exercise.md.");
}
