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

const QUERY = "How do cells produce energy?";
const K = 3;

export default async function run(): Promise<SearchHit[]> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  // 1. Embed the corpus (RETRIEVAL_DOCUMENT).
  const corpusRes = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: CORPUS,
    config: { taskType: "RETRIEVAL_DOCUMENT" },
  });
  const docVecs = (corpusRes.embeddings ?? []).map((e) => e.values ?? []);

  // 2. Embed the query (RETRIEVAL_QUERY).
  const queryRes = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: QUERY,
    config: { taskType: "RETRIEVAL_QUERY" },
  });
  const queryVec = queryRes.embeddings?.[0]?.values ?? [];

  // 3. Score + rank.
  const scored = docVecs.map((v, i) => ({
    index: i,
    text: CORPUS[i]!,
    score: cosineSimilarity(queryVec, v),
  }));
  scored.sort((a, b) => b.score - a.score);

  // 4. Return top K.
  return scored.slice(0, K);
}
