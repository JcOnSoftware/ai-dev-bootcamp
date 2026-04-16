// Docs:
//   SDK README      : https://github.com/openai/openai-node
//   API ref         : https://platform.openai.com/docs/api-reference/chat/create
//   Streaming guide : https://platform.openai.com/docs/guides/streaming

import OpenAI from "openai";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Call client.chat.completions.create with:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 128
 *        - messages: [{ role: "user", content: "Count from 1 to 5, one number per line." }]
 *        - stream: true
 *        - stream_options: { include_usage: true }
 *   3. Iterate over the stream with `for await (const chunk of stream)`.
 *      Each chunk has choices[0].delta.content (may be undefined for the last chunk).
 *   4. Collect the non-null content deltas into a `chunks: string[]` array.
 *   5. Return { chunks, fullText: chunks.join("") }.
 */
export default async function run(): Promise<{ chunks: string[]; fullText: string }> {
  throw new Error("TODO: implement the streaming call. Read exercise.md for context.");
}
