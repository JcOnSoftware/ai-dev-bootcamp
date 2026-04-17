// Docs:
//   SDK README : https://github.com/googleapis/js-genai
//   Streaming  : https://ai.google.dev/gemini-api/docs/text-generation#generate-a-text-stream
//   API ref    : https://ai.google.dev/api/generate-content

import { GoogleGenAI } from "@google/genai";

export interface StreamReport {
  text: string;
  chunkCount: number;
}

export default async function run(): Promise<StreamReport> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash-lite",
    contents: "List three unusual hobbies, each on its own line.",
    config: { maxOutputTokens: 128 },
  });

  let text = "";
  let chunkCount = 0;
  for await (const chunk of stream) {
    chunkCount += 1;
    if (chunk.text) {
      text += chunk.text;
    }
  }

  return { text, chunkCount };
}
