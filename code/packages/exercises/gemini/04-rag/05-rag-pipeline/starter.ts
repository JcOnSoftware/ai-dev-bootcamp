// Docs:
//   Embeddings guide : https://ai.google.dev/gemini-api/docs/embeddings
//   RAG pattern      : https://ai.google.dev/gemini-api/docs/embeddings#retrieval-augmented-generation
//   Prompting tips   : https://ai.google.dev/gemini-api/docs/prompting-strategies

import { GoogleGenAI } from "@google/genai";

/** Same 4-paragraph article as exercise 04 — reuse the data. */
export const ARTICLE = `
The mitochondrion is often called the powerhouse of the cell. It is a membrane-bound organelle found in most eukaryotic cells. Through a process called oxidative phosphorylation, mitochondria generate ATP (adenosine triphosphate), the primary energy currency of the cell. They contain their own DNA, which is inherited almost exclusively from the mother, and this genetic material supports the translation of proteins used within the mitochondrial matrix itself.

Photosynthesis, by contrast, occurs primarily in the chloroplasts of plant cells. Using chlorophyll to absorb light, chloroplasts convert sunlight, water, and carbon dioxide into glucose and oxygen. This glucose can then be broken down via glycolysis in the cytoplasm, and its products are further oxidized in the mitochondria to produce more ATP. Photosynthesis is the ultimate source of nearly all the chemical energy that sustains life on Earth.

The Krebs cycle, also known as the citric acid cycle, takes place in the mitochondrial matrix. Acetyl-CoA, derived from carbohydrates, fats, or proteins, enters the cycle and is oxidized to carbon dioxide through a series of enzymatic reactions. High-energy electrons captured by NADH and FADH2 are then passed to the electron transport chain, where they drive the pumping of protons across the inner membrane. This proton gradient ultimately powers the synthesis of ATP.

Beyond energy production, mitochondria are central to cellular signaling and apoptosis (programmed cell death). They regulate calcium concentrations, generate reactive oxygen species as byproducts of respiration, and respond to stress signals by triggering cell suicide when damage is irreversible. Defects in mitochondrial function are linked to a growing list of diseases, including neurodegenerative disorders such as Parkinson's and Alzheimer's, as well as metabolic and muscular conditions.
`.trim();

export function chunkByParagraph(text: string): string[] {
  return text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i]! * b[i]!;
  return sum;
}

export interface RagAnswer {
  /** The retrieved chunk IDs (indexes into the paragraph array), top-K sorted by score. */
  usedChunkIds: number[];
  /** Natural-language answer from Gemini, grounded in the retrieved chunks. */
  answer: string;
}

/**
 * TODO:
 *   End-to-end RAG:
 *     1. Chunk + embed the ARTICLE (RETRIEVAL_DOCUMENT).
 *     2. Embed the query "What disease is linked to broken mitochondria?"
 *        (RETRIEVAL_QUERY).
 *     3. Rank chunks by cosine similarity. Take top 2.
 *     4. Build a prompt that STUFFS the retrieved chunks into the context,
 *        followed by the user question. Example shape:
 *
 *        Answer the question using ONLY the sources below.
 *        If the answer isn't in the sources, say "not in the sources".
 *
 *        [Source 1] <chunk text>
 *        [Source 2] <chunk text>
 *
 *        Question: <query>
 *
 *     5. Call generateContent({ model: "gemini-2.5-flash-lite", contents: prompt,
 *        config: { maxOutputTokens: 200 } }).
 *     6. Return { usedChunkIds, answer: response.text }.
 */
export default async function run(): Promise<RagAnswer> {
  throw new Error("TODO: implement the full RAG loop. Read exercise.md.");
}
