// Docs:
//   SDK README  : https://github.com/openai/openai-node
//   API ref     : https://platform.openai.com/docs/api-reference/chat/create
//   Model IDs   : https://platform.openai.com/docs/models

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

export default async function run(): Promise<{ nano: ChatCompletion; mini: ChatCompletion }> {
  const client = new OpenAI();

  const prompt = "Explain what an API is in one sentence.";

  const nano = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 128,
    messages: [{ role: "user", content: prompt }],
  });

  const mini = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 128,
    messages: [{ role: "user", content: prompt }],
  });

  return { nano, mini };
}
