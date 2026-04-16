// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions    : https://platform.openai.com/docs/api-reference/chat/create
//   Structured Outputs  : https://platform.openai.com/docs/guides/structured-outputs

import OpenAI from "openai";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Make call 1 — the "subject" call:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 300
 *        - messages: [
 *            { role: "user", content: "Explain recursion to a 5-year-old." },
 *          ]
 *   3. Extract the text from call 1: response.choices[0].message.content
 *   4. Make call 2 — the "judge" call:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 256
 *        - messages: [
 *            {
 *              role: "system",
 *              content: "Rate the following explanation on a scale of 1-5 for clarity and simplicity. Respond with JSON: {\"score\": <number 1-5>, \"reasoning\": <string>}",
 *            },
 *            { role: "user", content: <the text from call 1> },
 *          ]
 *        - response_format: { type: "json_schema", json_schema: { name: "evaluation", strict: true, schema: { type: "object", properties: { score: { type: "number" }, reasoning: { type: "string" } }, required: ["score", "reasoning"], additionalProperties: false } } }
 *   5. Parse the judge's JSON response.
 *   6. Return { output: <text from call 1>, score: <number>, reasoning: <string> }.
 */
export default async function run(): Promise<{
  output: string;
  score: number;
  reasoning: string;
}> {
  throw new Error("TODO: implement the LLM-as-judge prompt evaluation. Read exercise.md for context.");
}
