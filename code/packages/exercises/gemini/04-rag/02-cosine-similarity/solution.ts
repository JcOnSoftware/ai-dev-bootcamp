// Docs:
//   Embeddings guide      : https://ai.google.dev/gemini-api/docs/embeddings
//   embedContent reference: https://ai.google.dev/api/embeddings
//   Cosine similarity 101 : https://en.wikipedia.org/wiki/Cosine_similarity

import { GoogleGenAI } from "@google/genai";

export interface SimilarityReport {
  relatedScore: number;
  unrelatedScore: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("vectors must be same length");
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i]! * b[i]!;
  }
  return sum;
}

export default async function run(): Promise<SimilarityReport> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: [
      "Dogs are loyal companions that need daily exercise.",
      "Cats are independent pets that groom themselves.",
      "PHP is a server-side scripting language for web development.",
    ],
  });

  const vecs = (response.embeddings ?? []).map((e) => e.values ?? []);
  const [a, b, c] = vecs;
  if (!a || !b || !c) throw new Error("embedding response missing vectors");

  return {
    relatedScore: cosineSimilarity(a, b),
    unrelatedScore: cosineSimilarity(a, c),
  };
}
