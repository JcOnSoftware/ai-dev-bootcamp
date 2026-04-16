// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Fake tool — do not change this function.
 * Returns an error string when b is 0.
 */
function fakeDivide(a: number, b: number): { result?: number; error?: string } {
  if (b === 0) return { error: "Error: division by zero" };
  return { result: a / b };
}

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Build a messages array starting with:
 *        [{ role: "user", content: "Calculate 100/5 and then 100/0, handle any errors gracefully." }]
 *   3. Define the tool `divide(a: number, b: number)`.
 *   4. Run the agent loop.
 *   5. When executing the tool:
 *        - Call fakeDivide(a, b).
 *        - Track whether an error occurred: if `result.error` is defined, set hadError = true.
 *        - Always return the result to the model (including errors) — let the model decide how to handle it.
 *   6. Collect the tool results in a `results` array (push each fakeDivide result).
 *   7. Return { results, hadError }.
 *
 * Read es/exercise.md or en/exercise.md for full context.
 */
export default async function run(): Promise<{
  results: Array<{ result?: number; error?: string }>;
  hadError: boolean;
}> {
  void fakeDivide;
  throw new Error("TODO: implement self-correction agent. Read exercise.md for context.");
}
