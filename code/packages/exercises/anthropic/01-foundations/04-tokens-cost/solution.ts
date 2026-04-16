import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

export interface TokensCostResult {
  response: Message;
  costUsd: number;
}

const HAIKU_INPUT_PER_MTOK_USD = 1;
const HAIKU_OUTPUT_PER_MTOK_USD = 5;

export default async function run(): Promise<TokensCostResult> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: "Explicá en 3 oraciones qué es un Large Language Model.",
      },
    ],
  });

  const { input_tokens, output_tokens } = response.usage;
  const costUsd =
    (input_tokens / 1_000_000) * HAIKU_INPUT_PER_MTOK_USD +
    (output_tokens / 1_000_000) * HAIKU_OUTPUT_PER_MTOK_USD;

  return { response, costUsd };
}
