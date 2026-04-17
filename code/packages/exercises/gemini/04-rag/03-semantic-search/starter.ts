// Docs:
//   Embeddings guide : https://ai.google.dev/gemini-api/docs/embeddings
//   Task types       : https://ai.google.dev/gemini-api/docs/embeddings#task-types

import { GoogleGenAI } from "@google/genai";

export const CORPUS: string[] = [
  "The mitochondrion is the powerhouse of the cell, producing ATP through oxidative phosphorylation.",
  "JavaScript is a high-level, interpreted programming language commonly used for web development.",
  "The Eiffel Tower in Paris was completed in 1889 for the World's Fair.",
  "Photosynthesis in plants converts sunlight, water, and carbon dioxide into glucose and oxygen.",
  "Git is a distributed version control system designed to handle projects of any size efficiently.",
  "The Great Wall of China stretches over 21,000 kilometers across northern China.",
  "Machine learning models learn patterns from data to make predictions on new, unseen inputs.",
  "Sushi is a Japanese dish combining vinegared rice with raw fish or vegetables.",
];

export interface SearchHit {
  index: number;
  text: string;
  score: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i]! * b[i]!;
  return sum;
}

/**
 * TODO:
 *   Build a tiny semantic search pipeline:
 *     1. Embed the CORPUS as a single embedContent call (`contents: CORPUS`).
 *        Best practice: config.taskType: "RETRIEVAL_DOCUMENT" for corpus items.
 *     2. Embed the `query` string with config.taskType: "RETRIEVAL_QUERY"
 *        so Gemini uses its query-optimized pathway.
 *     3. For each doc, compute cosine similarity to the query.
 *     4. Return the top K hits sorted by score DESCENDING, each with
 *        { index, text, score }.
 *
 *   Test query: "How do cells produce energy?"
 *   Expected top hit: the mitochondrion sentence (index 0).
 */
export default async function run(): Promise<SearchHit[]> {
  throw new Error("TODO: implement semantic top-K retrieval. Read exercise.md.");
}
