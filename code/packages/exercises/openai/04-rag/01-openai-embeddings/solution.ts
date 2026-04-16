// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Embeddings guide : https://platform.openai.com/docs/guides/embeddings
//   Embeddings API   : https://platform.openai.com/docs/api-reference/embeddings/create

import OpenAI from "openai";

export default async function run(): Promise<{
  embeddings: { embedding: number[]; index: number; object: string }[];
  dimensions: number;
}> {
  const client = new OpenAI();

  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: ["Hello world", "Hola mundo"],
  });

  return {
    embeddings: response.data,
    dimensions: response.data[0]!.embedding.length,
  };
}
