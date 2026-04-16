// Docs:
//   SDK README  : https://github.com/openai/openai-node
//   API ref     : https://platform.openai.com/docs/api-reference/chat/create
//   Model IDs   : https://platform.openai.com/docs/models

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Make TWO separate API calls with the same prompt:
 *        - First call:  model "gpt-4.1-nano"
 *        - Second call: model "gpt-4o-mini"
 *      Use the same prompt for both: "Explain what an API is in one sentence."
 *      Set max_completion_tokens to a reasonable value (e.g. 128).
 *   3. Return both responses as { nano: ChatCompletion, mini: ChatCompletion }.
 *
 * This lets you compare quality and cost between a nano and a mini model.
 */
export default async function run(): Promise<{ nano: ChatCompletion; mini: ChatCompletion }> {
  throw new Error("TODO: implement two API calls comparing gpt-4.1-nano vs gpt-4o-mini. Read exercise.md for context.");
}
