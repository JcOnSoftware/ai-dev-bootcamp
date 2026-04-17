// Docs:
//   Embeddings guide : https://ai.google.dev/gemini-api/docs/embeddings
//   RAG pattern      : https://ai.google.dev/gemini-api/docs/embeddings#retrieval-augmented-generation
//   Prompting tips   : https://ai.google.dev/gemini-api/docs/prompting-strategies

import { GoogleGenAI } from "@google/genai";

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
  usedChunkIds: number[];
  answer: string;
}

const QUERY = "What disease is linked to broken mitochondria?";
const K = 2;

export default async function run(): Promise<RagAnswer> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  // 1. Chunk + embed corpus.
  const chunks = chunkByParagraph(ARTICLE);
  const corpus = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: chunks,
    config: { taskType: "RETRIEVAL_DOCUMENT" },
  });
  const chunkVecs = (corpus.embeddings ?? []).map((e) => e.values ?? []);

  // 2. Embed query.
  const queryRes = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: QUERY,
    config: { taskType: "RETRIEVAL_QUERY" },
  });
  const queryVec = queryRes.embeddings?.[0]?.values ?? [];

  // 3. Rank, take top K.
  const ranked = chunks
    .map((text, id) => ({ id, text, score: cosineSimilarity(queryVec, chunkVecs[id]!) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, K);

  // 4. Stuff prompt.
  const sources = ranked.map((r, i) => `[Source ${i + 1}] ${r.text}`).join("\n\n");
  const prompt =
    `Answer the question using ONLY the sources below. If the answer isn't in the sources, say "not in the sources".\n\n` +
    sources +
    `\n\nQuestion: ${QUERY}`;

  // 5. Generate grounded answer.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
    config: { maxOutputTokens: 200 },
  });

  return {
    usedChunkIds: ranked.map((r) => r.id),
    answer: response.text ?? "",
  };
}
