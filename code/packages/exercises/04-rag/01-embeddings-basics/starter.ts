// Docs:
//   Voyage AI embeddings:  https://docs.voyageai.com/reference/embeddings
//   Voyage models:         https://docs.voyageai.com/docs/embeddings

/**
 * Embeddings Basics — Starter
 *
 * Tu tarea: implementar las funciones de embeddings usando la Voyage AI API.
 *
 * Voyage AI retorna vectores L2-normalizados, por lo que el producto punto
 * entre dos vectores es equivalente a la similitud coseno.
 *
 * Parámetro importante: `input_type`
 *   - "document" → para textos del corpus (lo que vas a buscar)
 *   - "query"    → para la consulta (lo que buscas)
 * No confundirlos mejora la calidad de la búsqueda.
 */

/**
 * Embeds an array of texts using the Voyage AI API.
 * Use model "voyage-3.5-lite" and pass the input_type parameter.
 *
 * @param texts     Array of strings to embed
 * @param inputType "document" for corpus texts, "query" for search queries
 * @returns         2D array: one embedding per input text (each 1024 floats)
 */
export async function embed(
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][]> {
  throw new Error("TODO: implementá embed() usando fetch a la Voyage AI API.");
}

/**
 * Computes the cosine similarity between two L2-normalized vectors.
 * Since Voyage normalizes embeddings, this is just the dot product.
 *
 * @param a First embedding vector
 * @param b Second embedding vector
 * @returns  Similarity score in [-1, 1] (1 = identical, 0 = orthogonal)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  throw new Error("TODO: implementá cosineSimilarity() como producto punto.");
}

/**
 * Demonstrates embedding basics:
 * 1. Embeds a query about prompt caching
 * 2. Embeds a similar text and a dissimilar text
 * 3. Returns the first embedding, its dimension, and the similarity score
 *    between the query and the similar text
 */
export default async function run(): Promise<{
  embedding: number[];
  dimension: number;
  similarityScore: number;
}> {
  throw new Error("TODO: implementá run() para demostrar embeddings básicos.");
}
