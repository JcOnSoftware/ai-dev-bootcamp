// Docs:
//   SDK README  : https://github.com/openai/openai-node
//   API ref     : https://platform.openai.com/docs/api-reference/chat/create
//   Pricing     : https://platform.openai.com/docs/pricing

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

export default async function run(): Promise<{ response: ChatCompletion; cost: number }> {
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 128,
    messages: [
      {
        role: "user",
        content: "What is the difference between a function and a method? Answer in two sentences.",
      },
    ],
  });

  const usage = response.usage!;
  // gpt-4.1-nano pricing: $0.10/1M input tokens, $0.40/1M output tokens
  const cost = (usage.prompt_tokens * 0.10 + usage.completion_tokens * 0.40) / 1_000_000;

  return { response, cost };
}
