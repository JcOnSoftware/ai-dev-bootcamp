// Docs:
//   Function calling guide   : https://ai.google.dev/gemini-api/docs/function-calling
//   Parallel tool calling    : https://ai.google.dev/gemini-api/docs/function-calling#parallel
//   response.functionCalls   : https://ai.google.dev/api/generate-content#GenerateContentResponse

import { GoogleGenAI, Type } from "@google/genai";

export interface ParallelResult {
  calledFunctions: string[];
  locations: string[];
}

export default async function run(): Promise<ParallelResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const weatherDecl = {
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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "What's the weather in Tokyo, Buenos Aires, and Berlin?",
    config: {
      tools: [{ functionDeclarations: [weatherDecl] }],
      maxOutputTokens: 256,
    },
  });

  const fns = response.functionCalls ?? [];
  return {
    calledFunctions: fns.map((c) => c.name ?? ""),
    locations: fns.map((c) => String((c.args as Record<string, unknown> | undefined)?.["location"] ?? "")),
  };
}
