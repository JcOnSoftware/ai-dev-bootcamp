// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Embeddings guide : https://platform.openai.com/docs/guides/embeddings
//   Embeddings API   : https://platform.openai.com/docs/api-reference/embeddings/create

import OpenAI from "openai";

/**
 * TODO:
 *   1. Create an OpenAI client (reads OPENAI_API_KEY from env automatically).
 *   2. Call client.embeddings.create() with:
 *        - model: "text-embedding-3-small"
 *        - input: ["Hello world", "Hola mundo"]
 *   3. Return an object with:
 *        - embeddings: the response.data array (each item has an `embedding` number[])
 *        - dimensions: the length of the first embedding vector (response.data[0].embedding.length)
 *
 * The default dimension for text-embedding-3-small is 1536.
 *
 * If you get stuck, check the "Embeddings guide" link above.
 */
export default async function run(): Promise<{
  embeddings: { embedding: number[]; index: number; object: string }[];
  dimensions: number;
}> {
  throw new Error("TODO: implement OpenAI embeddings. Read exercise.md for context.");
}
