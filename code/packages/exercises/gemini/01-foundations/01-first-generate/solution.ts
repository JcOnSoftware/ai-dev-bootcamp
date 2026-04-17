// Docs:
//   SDK README  : https://github.com/googleapis/js-genai
//   API ref     : https://ai.google.dev/api/generate-content
//   Model IDs   : https://ai.google.dev/gemini-api/docs/models

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

export default async function run(): Promise<GenerateContentResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Say hello briefly in Spanish, one short sentence.",
    config: { maxOutputTokens: 128 },
  });

  return response;
}
