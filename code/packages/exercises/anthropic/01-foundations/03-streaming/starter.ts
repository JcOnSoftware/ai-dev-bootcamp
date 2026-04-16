// Docs:
//   Streaming guide : https://docs.claude.com/en/docs/build-with-claude/streaming
//   SDK README      : https://github.com/anthropics/anthropic-sdk-typescript
//   API ref         : https://docs.claude.com/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

export interface StreamingResult {
  accumulatedText: string;
  finalMessage: Message;
}

/**
 * TODO:
 *   1. Instancia un cliente Anthropic.
 *   2. Abrí un stream con client.messages.stream({ ... }) hacia Haiku.
 *        - max_tokens: ≤ 300
 *        - Un mensaje user corto (ej: "Contá en 3 oraciones una anécdota graciosa sobre programación")
 *   3. Iterá los eventos con `for await (const event of stream)`.
 *      Acumulá en un string los `content_block_delta` cuyo delta.type === "text_delta".
 *   4. Al final: const finalMessage = await stream.finalMessage();
 *   5. Retorná { accumulatedText, finalMessage }.
 *
 * Si te trabás: exercise.md sección "Docs & references" — sobre todo la guía de streaming.
 */
export default async function run(): Promise<StreamingResult> {
  throw new Error(
    "TODO: implementá el streaming. Leé exercise.md — sección Docs & references tiene la guía oficial.",
  );
}
