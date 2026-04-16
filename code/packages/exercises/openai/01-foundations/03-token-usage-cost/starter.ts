// Docs:
//   SDK README  : https://github.com/openai/openai-node
//   API ref     : https://platform.openai.com/docs/api-reference/chat/create
//   Pricing     : https://platform.openai.com/docs/pricing

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Make a call with model "gpt-4.1-nano", max_completion_tokens: 128,
 *      and any user message you like.
 *   3. Extract the token usage from the response.
 *   4. Calculate the cost in USD using gpt-4.1-nano rates:
 *        - Input:  $0.10 per 1,000,000 tokens
 *        - Output: $0.40 per 1,000,000 tokens
 *      Formula: (prompt_tokens * 0.10 + completion_tokens * 0.40) / 1_000_000
 *   5. Return { response, cost } where cost is a number (in USD).
 */
export default async function run(): Promise<{ response: ChatCompletion; cost: number }> {
  throw new Error("TODO: implement the call and cost calculation. Read exercise.md for context.");
}
