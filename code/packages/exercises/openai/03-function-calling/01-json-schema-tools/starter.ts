// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Call client.chat.completions.create with:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 256
 *        - messages: [{ role: "user", content: "What's the weather in Tokyo?" }]
 *        - tools: an array with one tool of type "function" named "get_weather"
 *            The function must have:
 *              - description: "Get the current weather for a location"
 *              - parameters: a JSON Schema object with:
 *                  - "location" (string, required): city and country
 *                  - "unit" (string, enum: ["celsius", "fahrenheit"]): temperature unit
 *   3. Return the response directly (do NOT execute the tool).
 *      The model will respond with finish_reason: "tool_calls".
 */
export default async function run(): Promise<ChatCompletion> {
  throw new Error("TODO: implement the function tool definition. Read exercise.md for context.");
}
