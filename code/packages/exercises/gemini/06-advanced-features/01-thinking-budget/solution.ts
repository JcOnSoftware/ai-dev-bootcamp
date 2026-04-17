// Docs:
//   Thinking guide       : https://ai.google.dev/gemini-api/docs/thinking
//   thinkingConfig field : https://ai.google.dev/api/generate-content#ThinkingConfig
//   UsageMetadata fields : https://ai.google.dev/api/generate-content#UsageMetadata

import { GoogleGenAI } from "@google/genai";

export interface ThinkingReport {
  thoughtsTokenCount: number;
  candidatesTokenCount: number;
  answer: string;
}

export default async function run(): Promise<ThinkingReport> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:
      "A train leaves NYC at 8:00 AM traveling 60 mph. Another leaves Boston at 9:00 AM traveling 70 mph toward NYC. The cities are 215 miles apart. At what time do they meet?",
    config: {
      thinkingConfig: { thinkingBudget: 1024 },
      maxOutputTokens: 400,
    },
  });

  const usage = response.usageMetadata ?? {};
  return {
    thoughtsTokenCount: usage.thoughtsTokenCount ?? 0,
    candidatesTokenCount: usage.candidatesTokenCount ?? 0,
    answer: response.text ?? "",
  };
}
