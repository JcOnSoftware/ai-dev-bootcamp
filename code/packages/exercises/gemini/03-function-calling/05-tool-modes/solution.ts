// Docs:
//   Function calling modes : https://ai.google.dev/gemini-api/docs/function-calling#modes
//   ToolConfig reference   : https://ai.google.dev/api/caching#ToolConfig
//   FunctionCallingConfig  : https://ai.google.dev/api/caching#FunctionCallingConfig

import { GoogleGenAI, Type, FunctionCallingConfigMode } from "@google/genai";

export interface ModesResult {
  autoCalled: boolean;
  forcedFunctionName: string;
}

const WEATHER_DECL = {
  name: "get_weather",
  description: "Get the current weather conditions for a given city or location.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: "City and country." },
    },
    required: ["location"],
  },
};

const tools = [{ functionDeclarations: [WEATHER_DECL] }];

export default async function run(): Promise<ModesResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  // --- Call 1: AUTO — model decides (should NOT call the tool) -------------
  const autoResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Tell me a joke.",
    config: {
      tools,
      toolConfig: {
        functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO },
      },
      maxOutputTokens: 128,
    },
  });
  const autoCalled = (autoResponse.functionCalls?.length ?? 0) > 0;

  // --- Call 2: ANY — force the model to call SOME function ------------------
  const anyResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Tell me a joke.",
    config: {
      tools,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: ["get_weather"],
        },
      },
      maxOutputTokens: 128,
    },
  });

  const forcedCall = anyResponse.functionCalls?.[0];
  if (!forcedCall?.name) {
    throw new Error("mode ANY failed to force a function call.");
  }

  return {
    autoCalled,
    forcedFunctionName: forcedCall.name,
  };
}
