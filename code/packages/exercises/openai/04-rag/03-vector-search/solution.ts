// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Embeddings guide : https://platform.openai.com/docs/guides/embeddings
//   Embeddings API   : https://platform.openai.com/docs/api-reference/embeddings/create

import OpenAI from "openai";

const DOCUMENTS = [
  "The Python programming language was created by Guido van Rossum in 1991.",
  "TypeScript is a strongly typed superset of JavaScript developed by Microsoft.",
  "The Amazon rainforest produces 20% of the world's oxygen supply.",
  "Quantum computing uses qubits instead of classical bits to perform calculations.",
  "The Eiffel Tower was built between 1887 and 1889 as the entrance arch of the World's Fair.",
];

const QUERY = "What is TypeScript and who made it?";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    magA += (a[i] ?? 0) ** 2;
    magB += (b[i] ?? 0) ** 2;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export default async function run(): Promise<{
  query: string;
  results: { text: string; similarity: number }[];
}> {
  const client = new OpenAI();

  // Embed all inputs in one call for efficiency
  const allTexts = [QUERY, ...DOCUMENTS];
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: allTexts,
  });

  const queryEmbedding = response.data[0]!.embedding;
  const docEmbeddings = response.data.slice(1);

  const results = DOCUMENTS.map((text, i) => ({
    text,
    similarity: cosineSimilarity(queryEmbedding, docEmbeddings[i]!.embedding),
  })).sort((a, b) => b.similarity - a.similarity);

  return { query: QUERY, results };
}
