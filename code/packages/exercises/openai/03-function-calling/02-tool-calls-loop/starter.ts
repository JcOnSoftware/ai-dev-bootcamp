// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

/**
 * Fake tool implementation — do not change this function.
 * In a real app this would call a weather API.
 */
function fakeGetWeather(_location: string): { temperature: number; condition: string } {
  return { temperature: 22, condition: "sunny" };
}

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Build a messages array starting with:
 *        [{ role: "user", content: "What's the weather in Buenos Aires?" }]
 *   3. Define a `get_weather` tool with parameter `location` (string, required).
 *   4. Make the FIRST API call with model "gpt-4.1-nano", max_completion_tokens: 512,
 *      the messages array, and tools.
 *   5. Push the assistant message into the messages array.
 *   6. For each tool_call in assistantMessage.tool_calls:
 *        a. Parse the arguments JSON to get `location`.
 *        b. Call fakeGetWeather(location) to get the result.
 *        c. Push a { role: "tool", tool_call_id, content: JSON.stringify(result) }
 *           message into the messages array.
 *   7. Make the SECOND API call with the updated messages.
 *   8. Return the final response.
 */
export default async function run(): Promise<ChatCompletion> {
  void fakeGetWeather; // keep reference — remove once you use it
  throw new Error("TODO: implement the tool calling loop. Read exercise.md for context.");
}
