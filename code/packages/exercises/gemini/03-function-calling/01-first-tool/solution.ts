// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   FunctionDeclaration    : https://ai.google.dev/api/caching#FunctionDeclaration
//   Schema type enum       : https://ai.google.dev/api/caching#Schema

import { GoogleGenAI, Type } from "@google/genai";

export interface FirstToolResult {
  calledFunction: string;
  calledArgs: Record<string, unknown>;
}

export default async function run(): Promise<FirstToolResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const getWeatherDecl = {
    name: "get_current_weather",
    description: "Get the current weather conditions for a given city or location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: {
          type: Type.STRING,
          description: "City and country, e.g. 'Tokyo, Japan'",
        },
      },
      required: ["location"],
    },
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "What's the weather in Tokyo right now?",
    config: {
      tools: [{ functionDeclarations: [getWeatherDecl] }],
      maxOutputTokens: 256,
    },
  });

  const call = response.functionCalls?.[0];
  if (!call) {
    throw new Error("Model did not return a function call — check the tool declaration + prompt.");
  }

  return {
    calledFunction: call.name ?? "",
    calledArgs: (call.args ?? {}) as Record<string, unknown>,
  };
}
