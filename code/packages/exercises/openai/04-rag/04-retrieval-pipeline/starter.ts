// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Embeddings guide : https://platform.openai.com/docs/guides/embeddings
//   Chat Completions : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";

/**
 * TODO — Full RAG pipeline:
 *   1. Chunk the CORPUS into pieces of ~200 chars with 50-char overlap.
 *   2. Embed all chunks in one call to client.embeddings.create().
 *   3. Embed the QUERY in the same call (or a separate one).
 *   4. Compute cosine similarity between the query embedding and each chunk embedding.
 *   5. Pick the top 2 most relevant chunks as context.
 *   6. Call client.chat.completions.create() with:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 256
 *        - messages: [
 *            { role: "system", content: "Answer using only the provided context." },
 *            { role: "user",   content: `Context:\n${context}\n\nQuestion: ${QUERY}` }
 *          ]
 *   7. Return { query: QUERY, context: topChunks, answer: response.choices[0].message.content }.
 *
 * The harness captures only chat.completions.create — test chat call via `calls`, and
 * the return value via `userReturn`.
 */

const CORPUS = `TypeScript is a programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript and adds optional static typing to the language. TypeScript is designed for the development of large applications and transcompiles to JavaScript.

Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Python is dynamically typed and garbage-collected. It supports multiple programming paradigms, including structured, object-oriented and functional programming.

Rust is a multi-paradigm, general-purpose programming language. Rust emphasizes performance, type safety, and concurrency. It enforces memory safety, meaning that all references point to valid memory. It achieves memory safety without a garbage collector.`;

const QUERY = "What programming language is maintained by Microsoft and compiles to JavaScript?";

export default async function run(): Promise<{
  query: string;
  context: string[];
  answer: string;
}> {
  throw new Error("TODO: implement the full RAG pipeline. Read exercise.md for context.");
}
