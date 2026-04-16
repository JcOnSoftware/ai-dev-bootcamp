// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Embeddings guide : https://platform.openai.com/docs/guides/embeddings
//   Chat Completions : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";

/**
 * TODO — RAG pipeline with citations:
 *   1. Chunk the CORPUS into pieces of ~200 chars with 50-char overlap.
 *   2. Embed all chunks + the QUERY in one embeddings call.
 *   3. Find top 2 relevant chunks.
 *   4. Call chat.completions.create() with:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 300
 *        - system: "You are a helpful assistant. Answer using only the provided context.
 *                   Always cite your sources using [Source N] format where N is the source number."
 *        - user: list the chunks as [Source 1] ..., [Source 2] ..., then ask the question
 *   5. Extract citations from the answer using a regex like /\[Source \d+\]/g
 *   6. Return { answer, citations } where citations is the array of matched citation strings.
 *
 * The harness captures chat.completions.create — test via `lastCall` and `userReturn`.
 */

const CORPUS = `TypeScript is a programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript and adds optional static typing to the language. TypeScript is designed for the development of large applications and transcompiles to JavaScript.

Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Python is dynamically typed and garbage-collected. It supports multiple programming paradigms, including structured, object-oriented and functional programming.

Rust is a multi-paradigm, general-purpose programming language. Rust emphasizes performance, type safety, and concurrency. It enforces memory safety, meaning that all references point to valid memory. It achieves memory safety without a garbage collector.`;

const QUERY = "Which language was created by Microsoft and what is it a superset of?";

export default async function run(): Promise<{
  answer: string;
  citations: string[];
}> {
  throw new Error("TODO: implement RAG with citation extraction. Read exercise.md for context.");
}
