// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Structured Outputs  : https://platform.openai.com/docs/guides/structured-outputs
//   API ref             : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Call client.chat.completions.create with:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 256
 *        - messages: [
 *            { role: "system", content: "Extract structured data from the user message." },
 *            { role: "user", content: "My name is Ada Lovelace. I was born on December 10, 1815 in London." },
 *          ]
 *        - response_format: {
 *            type: "json_schema",
 *            json_schema: {
 *              name: "person_info",
 *              strict: true,
 *              schema: {
 *                type: "object",
 *                properties: {
 *                  name: { type: "string" },
 *                  birth_date: { type: "string" },
 *                  birth_city: { type: "string" },
 *                },
 *                required: ["name", "birth_date", "birth_city"],
 *                additionalProperties: false,
 *              },
 *            },
 *          }
 *   3. Parse the JSON string from response.choices[0].message.content.
 *   4. Return { response, parsed } where parsed is the parsed object.
 */
export default async function run(): Promise<{ response: ChatCompletion; parsed: unknown }> {
  throw new Error("TODO: implement the structured output call. Read exercise.md for context.");
}
