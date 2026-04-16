// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions API: https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Create an empty messages array: ChatCompletionMessageParam[]
 *   3. Turn 1:
 *      a. Push { role: "user", content: "My name is Ada." }
 *      b. Call client.chat.completions.create with model "gpt-4.1-nano",
 *         max_completion_tokens: 64, and the current messages array.
 *      c. Push the assistant response into messages:
 *         { role: "assistant", content: response1.choices[0].message.content ?? "" }
 *   4. Turn 2:
 *      a. Push { role: "user", content: "What's my name?" }
 *      b. Call create again with the updated messages.
 *      c. Push the assistant response.
 *   5. Turn 3:
 *      a. Push { role: "user", content: "Say my name backwards." }
 *      b. Call create one more time — this is finalResponse.
 *   6. Return { turns: 3, finalResponse }
 */
export default async function run(): Promise<{
  turns: number;
  finalResponse: ChatCompletion;
}> {
  throw new Error("TODO: implement the conversation-memory exercise. Read exercise.md for context.");
}
