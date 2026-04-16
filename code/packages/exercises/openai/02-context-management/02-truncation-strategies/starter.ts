// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions API: https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Build a conversation: 1 system message + 10 user/assistant messages (5 pairs).
 *      Count originalCount = 1 + 10 = 11.
 *   3. Apply truncation: keep systemMessage + last 6 messages from history (last 3 exchanges).
 *      Count truncatedCount = 7.
 *   4. Send the truncated message array to client.chat.completions.create:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 128
 *   5. Return { originalCount, truncatedCount, response }
 *
 *   Tip: history.slice(-6) gives you the last 6 messages.
 */
export default async function run(): Promise<{
  originalCount: number;
  truncatedCount: number;
  response: ChatCompletion;
}> {
  throw new Error("TODO: implement the truncation-strategies exercise. Read exercise.md for context.");
}
