// Docs:
//   Function calling modes : https://ai.google.dev/gemini-api/docs/function-calling#modes
//   ToolConfig reference   : https://ai.google.dev/api/caching#ToolConfig
//   FunctionCallingConfig  : https://ai.google.dev/api/caching#FunctionCallingConfig

import { GoogleGenAI, Type, FunctionCallingConfigMode } from "@google/genai";

export interface ModesResult {
  /** Under mode AUTO the model may or may not call the tool — check if it did. */
  autoCalled: boolean;
  /** Under mode ANY the model MUST call a function. We record the name. */
  forcedFunctionName: string;
}

/**
 * TODO:
 *   By default (mode AUTO) Gemini decides for itself whether to call a tool.
 *   Sometimes you want control:
 *     - mode ANY  → FORCE the model to pick one of your declared functions.
 *     - mode NONE → FORBID the model from calling any function (text only).
 *
 *   The config field is toolConfig.functionCallingConfig.mode.
 *   Use the FunctionCallingConfigMode enum from @google/genai.
 *
 *   Do TWO calls with the same get_weather declaration and the same user
 *   message: "Tell me a joke."
 *
 *     1. mode: AUTO — expect plain text (no function call) because the prompt
 *        has nothing to do with weather.
 *     2. mode: ANY — expect the model to call get_weather anyway, inventing
 *        a location.
 *
 *   Return { autoCalled, forcedFunctionName }.
 */
export default async function run(): Promise<ModesResult> {
  throw new Error("TODO: call with mode AUTO then ANY and compare. Read exercise.md.");
}
