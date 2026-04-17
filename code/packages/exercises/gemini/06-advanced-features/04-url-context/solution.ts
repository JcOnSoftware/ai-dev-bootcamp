// Docs:
//   URL context guide : https://ai.google.dev/gemini-api/docs/url-context
//   Built-in tools    : https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools

import { GoogleGenAI } from "@google/genai";

export interface UrlContextResult {
  answer: string;
  toolRequested: boolean;
  mentionsTopic: boolean;
}

export default async function run(): Promise<UrlContextResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:
      "Using https://ai.google.dev/ as a reference, what does Google describe as Gemini's focus? Quote one short phrase.",
    config: {
      tools: [{ urlContext: {} }],
      maxOutputTokens: 400,
    },
  });

  const answer = response.text ?? "";
  return {
    answer,
    toolRequested: true,
    mentionsTopic: /gemini/i.test(answer),
  };
}
