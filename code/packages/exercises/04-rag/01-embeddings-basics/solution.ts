// Docs:
//   Voyage AI embeddings:  https://docs.voyageai.com/reference/embeddings
//   Voyage models:         https://docs.voyageai.com/docs/embeddings

/**
 * Voyage AI HTTP client.
 * Inlined per exercise to teach the HTTP contract directly.
 */
async function voyageEmbed(
  inputs: string[],
  inputType: "document" | "query",
): Promise<{ embeddings: number[][]; totalTokens: number }> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: inputs, model: "voyage-3.5-lite", input_type: inputType }),
  });
  if (!res.ok) throw new Error(`Voyage API error: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
    usage: { total_tokens: number };
  };
  return {
    embeddings: data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding),
    totalTokens: data.usage.total_tokens,
  };
}

/**
 * Embeds an array of texts using Voyage AI.
 * Use "document" for corpus content and "query" for search queries —
 * this asymmetry is important for retrieval quality.
 */
export async function embed(
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][]> {
  const { embeddings } = await voyageEmbed(texts, inputType);
  return embeddings;
}

/**
 * Computes cosine similarity between two L2-normalized vectors.
 * Voyage normalizes all embeddings, so dot product == cosine similarity.
 * This means: no need to divide by magnitudes — they are already 1.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
  }
  return dot;
}

/**
 * Demonstrates embedding basics:
 * - Embeds a query and two texts (one similar, one dissimilar) in a single API call
 * - Returns the first embedding, its dimension, and the similarity score
 *
 * Note: All three texts are batched in ONE call to minimize API usage.
 */
export default async function run(): Promise<{
  embedding: number[];
  dimension: number;
  similarityScore: number;
}> {
  const query = "What is prompt caching?";
  const similar = "Prompt caching allows resuming from cached prefixes to reduce API costs.";
  const dissimilar = "The weather forecast calls for sunny skies and mild temperatures.";

  // Batch all three into a single API call
  const [queryVec, similarVec, dissimilarVec] = await embed(
    [query, similar, dissimilar],
    "document",
  );

  const embedding = queryVec!;
  const dimension = embedding.length;
  const similarityScore = cosineSimilarity(queryVec!, similarVec!);

  console.log(`Dimension: ${dimension}`);
  console.log(`Similar text score:    ${similarityScore.toFixed(4)}`);
  console.log(
    `Dissimilar text score: ${cosineSimilarity(queryVec!, dissimilarVec!).toFixed(4)}`,
  );

  return { embedding, dimension, similarityScore };
}
