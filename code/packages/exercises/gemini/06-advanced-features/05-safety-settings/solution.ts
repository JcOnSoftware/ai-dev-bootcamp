// Docs:
//   Safety settings guide : https://ai.google.dev/gemini-api/docs/safety-settings
//   HarmCategory enum     : https://ai.google.dev/api/generate-content#HarmCategory
//   Threshold enum        : https://ai.google.dev/api/generate-content#HarmBlockThreshold

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

export interface SafetyResult {
  answer: string;
  finishReason: string;
  configuredCategories: string[];
}

export default async function run(): Promise<SafetyResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "Tell me a harmless one-sentence joke about programmers.",
    config: {
      safetySettings,
      maxOutputTokens: 128,
    },
  });

  return {
    answer: response.text ?? "",
    finishReason: response.candidates?.[0]?.finishReason ?? "",
    configuredCategories: safetySettings.map((s) => String(s.category)),
  };
}
