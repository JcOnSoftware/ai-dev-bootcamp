import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

export default async function run(): Promise<Message> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 128,
    messages: [
      {
        role: "user",
        content: "Saludá brevemente en español, una sola oración corta.",
      },
    ],
  });

  return response;
}
