// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Define a `get_weather(location: string)` tool.
 *   3. Use messages: [{ role: "user", content: "What's the weather in Paris?" }]
 *   4. Make 3 API calls with the same messages and tools, but different tool_choice:
 *        - Call 1: tool_choice: "auto"     → model decides
 *        - Call 2: tool_choice: "required" → model MUST call a tool
 *        - Call 3: tool_choice: "none"     → model must NOT call any tool
 *      Use model "gpt-4.1-nano", max_completion_tokens: 256 for all three.
 *   5. Return { autoResult, requiredResult, noneResult }.
 */
export default async function run(): Promise<{
  autoResult: ChatCompletion;
  requiredResult: ChatCompletion;
  noneResult: ChatCompletion;
}> {
  throw new Error("TODO: implement tool choice control. Read exercise.md for context.");
}
