import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

export interface ParamsResult {
  deterministic: Message;
  creative: Message;
}

export default async function run(): Promise<ParamsResult> {
  const client = new Anthropic();
  const model = "claude-haiku-4-5-20251001";

  const deterministic = await client.messages.create({
    model,
    max_tokens: 256,
    temperature: 0,
    messages: [
      {
        role: "user",
        content:
          "Extraé el nombre y email del siguiente texto en formato JSON {name, email}: 'Me llamo Juan Yovera y mi email es juan@ejemplo.com'.",
      },
    ],
  });

  const creative = await client.messages.create({
    model,
    max_tokens: 256,
    temperature: 0.9,
    messages: [
      {
        role: "user",
        content:
          "Dame 3 títulos creativos y distintos para un artículo sobre inteligencia artificial aplicada a la salud.",
      },
    ],
  });

  return { deterministic, creative };
}
