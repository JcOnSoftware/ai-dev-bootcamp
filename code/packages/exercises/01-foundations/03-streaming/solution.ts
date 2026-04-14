import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

export interface StreamingResult {
  accumulatedText: string;
  finalMessage: Message;
}

export default async function run(): Promise<StreamingResult> {
  const client = new Anthropic();

  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content:
          "Contá en 3 oraciones cortas una anécdota graciosa sobre programación.",
      },
    ],
  });

  let accumulatedText = "";
  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      accumulatedText += event.delta.text;
    }
  }

  const finalMessage = await stream.finalMessage();
  return { accumulatedText, finalMessage };
}
