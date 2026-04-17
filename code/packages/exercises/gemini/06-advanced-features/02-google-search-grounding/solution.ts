// Docs:
//   Grounding with Google Search : https://ai.google.dev/gemini-api/docs/grounding
//   Built-in tools               : https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools
//   groundingMetadata            : https://ai.google.dev/api/generate-content#GroundingMetadata

import { GoogleGenAI } from "@google/genai";

export interface GroundedAnswer {
  answer: string;
  hasGroundingMetadata: boolean;
  sourceCount: number;
}

export default async function run(): Promise<GroundedAnswer> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Who won the Best Picture Oscar in 2024?",
    config: {
      tools: [{ googleSearch: {} }],
      maxOutputTokens: 400,
    },
  });

  const candidate = response.candidates?.[0];
  const groundingMetadata = candidate?.groundingMetadata as
    | { groundingChunks?: unknown[] }
    | undefined;
  const hasGroundingMetadata = !!groundingMetadata;
  const sourceCount = Array.isArray(groundingMetadata?.groundingChunks)
    ? groundingMetadata!.groundingChunks.length
    : 0;

  return {
    answer: response.text ?? "",
    hasGroundingMetadata,
    sourceCount,
  };
}
