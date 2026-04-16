// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Structured Outputs  : https://platform.openai.com/docs/guides/structured-outputs
//   API ref             : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

export default async function run(): Promise<{ response: ChatCompletion; parsed: unknown }> {
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 256,
    messages: [
      { role: "system", content: "Extract structured data from the user message." },
      { role: "user", content: "My name is Ada Lovelace. I was born on December 10, 1815 in London." },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "person_info",
        strict: true,
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            birth_date: { type: "string" },
            birth_city: { type: "string" },
          },
          required: ["name", "birth_date", "birth_city"],
          additionalProperties: false,
        },
      },
    },
  });

  const parsed = JSON.parse(response.choices[0]!.message.content!);
  return { response, parsed };
}
