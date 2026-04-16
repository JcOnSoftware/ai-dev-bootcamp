// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions    : https://platform.openai.com/docs/api-reference/chat/create
//   Structured Outputs  : https://platform.openai.com/docs/guides/structured-outputs

import OpenAI from "openai";

interface Scores {
  relevance: number;
  accuracy: number;
  tone: number;
  overall: number;
  feedback: string;
}

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Make call 1 — the answer call:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 300
 *        - messages: [
 *            { role: "system", content: "You are a helpful assistant. Answer concisely and accurately." },
 *            { role: "user", content: "What are the main benefits of TypeScript over JavaScript?" },
 *          ]
 *      Save the answer text: response.choices[0].message.content
 *   3. Make call 2 — the scorer call:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 300
 *        - messages: [
 *            {
 *              role: "system",
 *              content: "You are an expert evaluator. Score the following answer on these criteria (1-5 each): relevance, accuracy, tone. Also provide an overall score and brief feedback.",
 *            },
 *            { role: "user", content: "Question: What are the main benefits of TypeScript over JavaScript?\n\nAnswer: " + <answer from call 1> },
 *          ]
 *        - response_format: { type: "json_schema" } with schema:
 *            {
 *              type: "object",
 *              properties: {
 *                relevance: { type: "number" },
 *                accuracy: { type: "number" },
 *                tone: { type: "number" },
 *                overall: { type: "number" },
 *                feedback: { type: "string" },
 *              },
 *              required: ["relevance", "accuracy", "tone", "overall", "feedback"],
 *              additionalProperties: false,
 *            }
 *   4. Parse the JSON from call 2.
 *   5. Return { answer: <text from call 1>, scores: <parsed object> }.
 */
export default async function run(): Promise<{ answer: string; scores: Scores }> {
  throw new Error("TODO: implement multi-criteria output scoring. Read exercise.md for context.");
}
