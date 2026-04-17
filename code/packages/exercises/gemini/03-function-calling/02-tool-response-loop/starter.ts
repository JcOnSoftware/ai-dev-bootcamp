// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   Multi-turn format      : https://ai.google.dev/gemini-api/docs/function-calling#multi-turn
//   Content roles          : https://ai.google.dev/api/caching#Content

import { GoogleGenAI, Type } from "@google/genai";

export interface LoopResult {
  /** The final natural-language answer. */
  answer: string;
  /** What the model requested on the first turn. */
  calledFunction: string;
  calledArgs: Record<string, unknown>;
  /** Total calls you made to generateContent. Should be 2. */
  turnCount: number;
}

/**
 * Stub weather provider — NO real network call. The model will ask for a city
 * and this returns a fixed-shape object the model can interpret.
 */
export function getCurrentWeather(args: { location: string }): {
  location: string;
  temperatureC: number;
  conditions: string;
} {
  return {
    location: args.location,
    temperatureC: 18,
    conditions: "partly cloudy",
  };
}

/**
 * TODO:
 *   This exercise closes the tool loop. Two generateContent calls:
 *
 *   1. TURN 1: send the user message + tool declaration → model responds
 *      with a functionCall (same pattern as exercise 01).
 *   2. Execute `getCurrentWeather(call.args)` locally.
 *   3. TURN 2: send back the full conversation including the function
 *      response. Gemini replies with a NATURAL-LANGUAGE answer.
 *
 *   The turn-2 contents array looks like:
 *     [
 *       { role: "user",  parts: [{ text: "What's the weather in Tokyo?" }] },
 *       { role: "model", parts: [{ functionCall: { name, args } }] },
 *       { role: "user",  parts: [{ functionResponse: { name, response: result } }] },
 *     ]
 *
 *   Return { answer, calledFunction, calledArgs, turnCount: 2 }.
 */
export default async function run(): Promise<LoopResult> {
  throw new Error("TODO: complete the function-calling loop. Read exercise.md for context.");
}
