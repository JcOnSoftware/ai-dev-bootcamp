// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

/** Fake tools — do not modify these. */
function fakeGetWeather(location: string): { temperature: number; condition: string } {
  void location;
  return { temperature: 15, condition: "cloudy" };
}

function fakeGetTime(timezone: string): { time: string; timezone: string } {
  void timezone;
  return { time: "14:30", timezone };
}

function fakeCalculate(expression: string): { result: number } {
  const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
  try {
    // biome-ignore lint/security/noEval: intentional fake calculator for exercise
    const result = eval(sanitized) as number;
    return { result };
  } catch {
    return { result: 0 };
  }
}

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Define 3 tools: get_weather(location), get_time(timezone), calculate(expression).
 *      Each takes a single required string parameter with a descriptive `description`.
 *   3. Start messages with: [{ role: "user", content: "What time is it in Tokyo and what's 15 * 7?" }]
 *   4. Make the FIRST API call with model "gpt-4.1-nano", max_completion_tokens: 512.
 *   5. Push the assistant message into messages.
 *   6. For each tool_call in assistantMessage.tool_calls:
 *        - Dispatch to fakeGetWeather / fakeGetTime / fakeCalculate based on the function name.
 *        - Push a role: "tool" message with the JSON-stringified result.
 *   7. Make the SECOND API call with the updated messages.
 *   8. Return the final response.
 */
export default async function run(): Promise<ChatCompletion> {
  void fakeGetWeather;
  void fakeGetTime;
  void fakeCalculate;
  throw new Error("TODO: implement multi-tool routing. Read exercise.md for context.");
}
