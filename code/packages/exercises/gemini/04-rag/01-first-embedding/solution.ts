// Docs:
//   SDK README            : https://github.com/googleapis/js-genai
//   Embeddings guide      : https://ai.google.dev/gemini-api/docs/embeddings
//   embedContent reference: https://ai.google.dev/api/embeddings

import { GoogleGenAI } from "@google/genai";

export interface EmbeddingResult {
  dimensions: number;
  firstFive: number[];
  l2Norm: number;
}

export default async function run(): Promise<EmbeddingResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: "The Amazon rainforest produces about 20% of the world's oxygen.",
  });

  const values = response.embeddings?.[0]?.values ?? [];
  const l2Norm = Math.sqrt(values.reduce((acc, v) => acc + v * v, 0));

  return {
    dimensions: values.length,
    firstFive: values.slice(0, 5),
    l2Norm,
  };
}
