// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Fake tool implementations — do not change these functions.
 */
function fakeSearchWeb(_query: string): string {
  return "3600 seconds per hour";
}

function fakeCalculate(expression: string): number {
  // Safe eval for simple math expressions
  const sanitized = expression.replace(/[^0-9+\-*/().]/g, "");
  return Function(`"use strict"; return (${sanitized})`)() as number;
}

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Build a messages array starting with:
 *        [{ role: "user", content: "How many seconds are in 3.5 hours?" }]
 *   3. Define two tools: `search_web(query: string)` and `calculate(expression: string)`.
 *   4. Run the agent loop:
 *        a. Call the API with model "gpt-4.1-nano", max_completion_tokens: 512.
 *        b. Push the assistant message into messages.
 *        c. If finish_reason is "tool_calls":
 *             - Execute each tool call using fakeSearchWeb or fakeCalculate.
 *             - Push a { role: "tool", tool_call_id, content: JSON.stringify(result) } message.
 *             - Increment a `steps` counter.
 *             - Continue the loop.
 *        d. If finish_reason is "stop": exit the loop.
 *   5. Return { steps, finalAnswer } where finalAnswer is the last assistant message content.
 *
 * Read es/exercise.md or en/exercise.md for full context.
 */
export default async function run(): Promise<{ steps: number; finalAnswer: string }> {
  void fakeSearchWeb;
  void fakeCalculate;
  throw new Error("TODO: implement the agent loop. Read exercise.md for context.");
}
