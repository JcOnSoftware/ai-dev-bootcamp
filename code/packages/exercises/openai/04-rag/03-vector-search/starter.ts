// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Embeddings guide : https://platform.openai.com/docs/guides/embeddings
//   Embeddings API   : https://platform.openai.com/docs/api-reference/embeddings/create

import OpenAI from "openai";

/**
 * TODO:
 *   1. Embed all 5 DOCUMENTS and the QUERY using text-embedding-3-small.
 *      Tip: you can embed all of them in a single call by passing an array.
 *   2. Implement cosineSimilarity(a, b) — the dot product of two unit vectors.
 *      Formula: sum(a[i] * b[i]) / (magnitude(a) * magnitude(b))
 *   3. Compute the similarity between the query embedding and each document embedding.
 *   4. Sort the results descending by similarity.
 *   5. Return { query: QUERY, results: sortedResults } where each result is { text, similarity }.
 *
 * The embeddings API is NOT captured by the harness — test via userReturn.
 */

const DOCUMENTS = [
  "The Python programming language was created by Guido van Rossum in 1991.",
  "TypeScript is a strongly typed superset of JavaScript developed by Microsoft.",
  "The Amazon rainforest produces 20% of the world's oxygen supply.",
  "Quantum computing uses qubits instead of classical bits to perform calculations.",
  "The Eiffel Tower was built between 1887 and 1889 as the entrance arch of the World's Fair.",
];

const QUERY = "What is TypeScript and who made it?";

export default async function run(): Promise<{
  query: string;
  results: { text: string; similarity: number }[];
}> {
  throw new Error("TODO: implement vector search with cosine similarity. Read exercise.md for context.");
}
