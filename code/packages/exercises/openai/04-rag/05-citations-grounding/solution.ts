// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Embeddings guide : https://platform.openai.com/docs/guides/embeddings
//   Chat Completions : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";

const CORPUS = `TypeScript is a programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript and adds optional static typing to the language. TypeScript is designed for the development of large applications and transcompiles to JavaScript.

Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Python is dynamically typed and garbage-collected. It supports multiple programming paradigms, including structured, object-oriented and functional programming.

Rust is a multi-paradigm, general-purpose programming language. Rust emphasizes performance, type safety, and concurrency. It enforces memory safety, meaning that all references point to valid memory. It achieves memory safety without a garbage collector.`;

const QUERY = "Which language was created by Microsoft and what is it a superset of?";

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const step = chunkSize - overlap;
  let start = 0;
  while (start < text.length) {
    const chunk = text.slice(start, start + chunkSize);
    if (chunk.trim().length > 0) chunks.push(chunk);
    start += step;
  }
  return chunks;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    magA += (a[i] ?? 0) ** 2;
    magB += (b[i] ?? 0) ** 2;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export default async function run(): Promise<{
  answer: string;
  citations: string[];
}> {
  const client = new OpenAI();
  const chunks = chunkText(CORPUS, 200, 50);

  const embResponse = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: [QUERY, ...chunks],
  });

  const queryEmbedding = embResponse.data[0]!.embedding;
  const chunkEmbeddings = embResponse.data.slice(1);

  const ranked = chunks
    .map((text, i) => ({ text, similarity: cosineSimilarity(queryEmbedding, chunkEmbeddings[i]!.embedding) }))
    .sort((a, b) => b.similarity - a.similarity);

  const topChunks = ranked.slice(0, 2).map((r) => r.text);
  const contextText = topChunks.map((c, i) => `[Source ${i + 1}] ${c}`).join("\n\n");

  const chatResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Answer using only the provided context. " +
          "Always cite your sources using [Source N] format where N is the source number.",
      },
      {
        role: "user",
        content: `Context:\n${contextText}\n\nQuestion: ${QUERY}`,
      },
    ],
  });

  const answer = chatResponse.choices[0]!.message.content ?? "";
  const citations = answer.match(/\[Source \d+\]/g) ?? [];

  return { answer, citations };
}
