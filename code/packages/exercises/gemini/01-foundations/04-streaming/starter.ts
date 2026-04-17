// Docs:
//   SDK README : https://github.com/googleapis/js-genai
//   Streaming  : https://ai.google.dev/gemini-api/docs/text-generation#generate-a-text-stream
//   API ref    : https://ai.google.dev/api/generate-content

import { GoogleGenAI } from "@google/genai";

export interface StreamReport {
  text: string;
  chunkCount: number;
}

/**
 * TODO:
 *   1. Call ai.models.generateContentStream({
 *        model: "gemini-2.5-flash-lite",
 *        contents: "List three unusual hobbies, each on its own line.",
 *        config: { maxOutputTokens: 128 },
 *      })
 *   2. The returned value is an async iterable. Iterate it with `for await`.
 *   3. Each chunk may have a `.text` convenience getter (string). Accumulate
 *      the text and count the chunks.
 *   4. Return { text, chunkCount }.
 */
export default async function run(): Promise<StreamReport> {
  throw new Error("TODO: implement the streaming call. Read exercise.md for context.");
}
