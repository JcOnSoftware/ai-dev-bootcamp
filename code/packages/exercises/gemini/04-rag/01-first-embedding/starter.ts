// Docs:
//   SDK README            : https://github.com/googleapis/js-genai
//   Embeddings guide      : https://ai.google.dev/gemini-api/docs/embeddings
//   embedContent reference: https://ai.google.dev/api/embeddings

import { GoogleGenAI } from "@google/genai";

export interface EmbeddingResult {
  dimensions: number;
  /** First 5 values so you can eyeball that it's real floats. */
  firstFive: number[];
  /** L2 norm of the vector — Gemini embeddings are approximately unit-length. */
  l2Norm: number;
}

/**
 * TODO:
 *   1. Call ai.models.embedContent({
 *        model: "gemini-embedding-001",
 *        contents: "The Amazon rainforest produces about 20% of the world's oxygen.",
 *      })
 *   2. The SDK returns { embeddings: [{ values: number[] }] }. Grab
 *      embeddings[0].values.
 *   3. Return { dimensions: values.length, firstFive: values.slice(0, 5), l2Norm }.
 *
 *   L2 norm = sqrt(sum(v * v for v in values)). Should be ~1 for unit-length
 *   embeddings — Gemini returns them normalized by default.
 */
export default async function run(): Promise<EmbeddingResult> {
  throw new Error("TODO: embed one sentence and report vector stats. Read exercise.md.");
}
