// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

/** Fake tool — do not modify. */
function fakeGetWeather(location: string): { location: string; temperature: number; condition: string } {
  const temps: Record<string, number> = { Tokyo: 18, London: 12, "New York": 8 };
  return { location, temperature: temps[location] ?? 20, condition: "partly cloudy" };
}

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Define a single `get_weather(location: string)` tool.
 *   3. Start messages with: [{ role: "user", content: "What's the weather in Tokyo, London, and New York?" }]
 *   4. Make the FIRST API call with:
 *        - model: "gpt-4.1-nano", max_completion_tokens: 512
 *        - parallel_tool_calls: true
 *   5. Push the assistant message into messages.
 *   6. Execute ALL tool_calls (the model may request 3 at once). For each:
 *        - Call fakeGetWeather(location).
 *        - Push a role: "tool" message.
 *      Tip: use Promise.all for concurrent execution.
 *   7. Make the SECOND API call with updated messages.
 *   8. Return { toolCallCount: toolCalls.length, response: finalResponse }
 */
export default async function run(): Promise<{ toolCallCount: number; response: ChatCompletion }> {
  void fakeGetWeather;
  throw new Error("TODO: implement parallel tool execution. Read exercise.md for context.");
}
