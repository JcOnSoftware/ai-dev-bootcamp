// Docs:
//   SDK README  : https://github.com/googleapis/js-genai
//   Models list : https://ai.google.dev/gemini-api/docs/models
//   Pricing     : https://ai.google.dev/pricing

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

export default async function run(): Promise<{
  flashLite: GenerateContentResponse;
  flash: GenerateContentResponse;
}> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });
  const prompt = "Explain what an API is in one sentence.";
  const config = { maxOutputTokens: 128 };

  const flashLite = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config,
  });

  const flash = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config,
  });

  return { flashLite, flash };
}
