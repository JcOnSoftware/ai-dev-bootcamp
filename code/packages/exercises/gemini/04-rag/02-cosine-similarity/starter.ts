// Docs:
//   Embeddings guide      : https://ai.google.dev/gemini-api/docs/embeddings
//   embedContent reference: https://ai.google.dev/api/embeddings
//   Cosine similarity 101 : https://en.wikipedia.org/wiki/Cosine_similarity

import { GoogleGenAI } from "@google/genai";

export interface SimilarityReport {
  /** Cosine similarity between a dog sentence and a cat sentence (related animals). */
  relatedScore: number;
  /** Cosine similarity between a dog sentence and a PHP programming sentence (unrelated). */
  unrelatedScore: number;
}

/**
 * TODO:
 *   1. Embed each of these three sentences with model "gemini-embedding-001":
 *        A = "Dogs are loyal companions that need daily exercise."
 *        B = "Cats are independent pets that groom themselves."
 *        C = "PHP is a server-side scripting language for web development."
 *
 *      You can pass them as a single call with contents: [A, B, C] — the SDK
 *      returns response.embeddings as a 3-element array in order.
 *
 *   2. Compute cosine similarity. Since Gemini embeddings are unit-length,
 *      cosineSimilarity(a, b) = sum(a[i] * b[i] for i in 0..n).
 *
 *   3. Return:
 *        relatedScore   = cosine(A, B)  // should be high, around 0.6-0.8
 *        unrelatedScore = cosine(A, C)  // should be lower, around 0.3-0.5
 *
 *   Key insight: cosine similarity is bounded in [-1, +1]. In practice with
 *   modern embeddings, values cluster in [0.3, 0.9] — anything >0.7 is "similar".
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("vectors must be same length");
  // TODO: return sum of a[i] * b[i]
  throw new Error("TODO: implement cosine similarity. Read exercise.md.");
}

export default async function run(): Promise<SimilarityReport> {
  throw new Error("TODO: embed 3 sentences, compute similarities, return the report. Read exercise.md.");
}
