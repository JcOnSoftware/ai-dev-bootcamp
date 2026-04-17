// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   Multi-turn format      : https://ai.google.dev/gemini-api/docs/function-calling#multi-turn
//   Content roles          : https://ai.google.dev/api/caching#Content

import { GoogleGenAI, Type } from "@google/genai";

export interface LoopResult {
  answer: string;
  calledFunction: string;
  calledArgs: Record<string, unknown>;
  turnCount: number;
}

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

const WEATHER_DECL = {
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

export default async function run(): Promise<LoopResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });
  const tools = [{ functionDeclarations: [WEATHER_DECL] }];
  let turnCount = 0;

  // --- Turn 1: user question ------------------------------------------------
  const userPrompt = "What's the weather in Tokyo?";
  const first = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: userPrompt,
    config: { tools, maxOutputTokens: 256 },
  });
  turnCount += 1;

  const call = first.functionCalls?.[0];
  if (!call?.name) {
    throw new Error("Model did not return a function call on turn 1.");
  }

  // --- Execute the tool locally --------------------------------------------
  const toolResult = getCurrentWeather(call.args as { location: string });

  // --- Turn 2: feed the tool result back -----------------------------------
  const second = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      { role: "user", parts: [{ text: userPrompt }] },
      { role: "model", parts: [{ functionCall: { name: call.name, args: call.args } }] },
      {
        role: "user",
        parts: [{ functionResponse: { name: call.name, response: toolResult } }],
      },
    ],
    config: { tools, maxOutputTokens: 256 },
  });
  turnCount += 1;

  return {
    answer: second.text ?? "",
    calledFunction: call.name,
    calledArgs: (call.args ?? {}) as Record<string, unknown>,
    turnCount,
  };
}
