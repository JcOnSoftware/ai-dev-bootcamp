// Docs:
//   SDK README  : https://github.com/openai/openai-node
//   API ref     : https://platform.openai.com/docs/api-reference/chat/create
//   Model IDs   : https://platform.openai.com/docs/models

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client (it reads OPENAI_API_KEY from env automatically).
 *   2. Call client.chat.completions.create with:
 *        - model: "gpt-4.1-nano" (cheapest model, see "Model IDs" link above)
 *        - max_completion_tokens: <= 200
 *        - messages: [{ role: "user", content: "say hello briefly in Spanish" }]
 *   3. Return the response.
 *
 * If you get stuck, read exercise.md (section "Docs & references") or hover
 * over `chat.completions.create` in your editor to see the full signature.
 */
export default async function run(): Promise<ChatCompletion> {
  throw new Error("TODO: implement the OpenAI chat completion call. Read exercise.md for context.");
}
