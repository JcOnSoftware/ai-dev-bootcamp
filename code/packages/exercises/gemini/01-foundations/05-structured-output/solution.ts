// Docs:
//   SDK README        : https://github.com/googleapis/js-genai
//   Structured output : https://ai.google.dev/gemini-api/docs/structured-output
//   Schema type enum  : https://ai.google.dev/api/caching#Schema

import { GoogleGenAI, Type } from "@google/genai";

export type Sentiment = "positive" | "negative" | "neutral";

export interface SentimentResult {
  sentiment: Sentiment;
  confidence: number;
}

export default async function run(): Promise<SentimentResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents:
      'Analyze the sentiment of this text and return JSON:\n"This new CLI tool is a lifesaver — saved me hours on the demo."',
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: {
            type: Type.STRING,
            enum: ["positive", "negative", "neutral"],
          },
          confidence: {
            type: Type.NUMBER,
          },
        },
        required: ["sentiment", "confidence"],
      },
      maxOutputTokens: 128,
    },
  });

  const raw = response.text ?? "{}";
  const parsed = JSON.parse(raw) as SentimentResult;
  return parsed;
}
