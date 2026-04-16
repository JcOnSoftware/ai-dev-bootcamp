// Docs:
//   SDK README  : https://github.com/openai/openai-node
//   API ref     : https://platform.openai.com/docs/api-reference/chat/create
//   Model IDs   : https://platform.openai.com/docs/models

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

export default async function run(): Promise<ChatCompletion> {
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 128,
    messages: [
      {
        role: "user",
        content: "Say hello briefly in Spanish, one short sentence.",
      },
    ],
  });

  return response;
}
