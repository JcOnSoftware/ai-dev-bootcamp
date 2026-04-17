// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   FunctionDeclaration    : https://ai.google.dev/api/caching#FunctionDeclaration

import { GoogleGenAI, Type } from "@google/genai";

export interface RouterResult {
  chosenFunction: string;
  chosenArgs: Record<string, unknown>;
}

export default async function run(): Promise<RouterResult> {
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

  const newsDecl = {
    name: "get_news_headlines",
    description: "Return a short list of recent news headlines on a given topic.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: "Subject of interest, e.g. 'AI research'." },
        max: { type: Type.INTEGER, description: "Maximum headlines to return, default 5." },
      },
      required: ["topic"],
    },
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Give me three recent headlines about AI research.",
    config: {
      tools: [{ functionDeclarations: [weatherDecl, newsDecl] }],
      maxOutputTokens: 256,
    },
  });

  const call = response.functionCalls?.[0];
  if (!call) {
    throw new Error("Model returned no function call — router failed.");
  }

  return {
    chosenFunction: call.name ?? "",
    chosenArgs: (call.args ?? {}) as Record<string, unknown>,
  };
}
