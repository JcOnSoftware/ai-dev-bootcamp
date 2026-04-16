// Docs:
//   SDK README  : https://github.com/anthropics/anthropic-sdk-typescript
//   API ref     : https://docs.claude.com/en/api/messages
//   Model IDs   : https://docs.claude.com/en/docs/about-claude/models/overview

import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

/**
 * TODO:
 *   1. Instancia un cliente Anthropic (no hace falta pasarle la API key,
 *      la toma de ANTHROPIC_API_KEY automáticamente).
 *   2. Llamá a client.messages.create con:
 *        - model: un Claude Haiku (ver "Model IDs" link arriba)
 *        - max_tokens: ≤ 200
 *        - messages: [{ role: "user", content: "saluda en español brevemente" }]
 *   3. Retorná la respuesta.
 *
 * Si te trabás, leé exercise.md (sección "Docs & references") o hacé hover
 * sobre `messages.create` en tu editor para ver la firma completa.
 */
export default async function run(): Promise<Message> {
  throw new Error("TODO: implementá la llamada a Claude. Leé exercise.md para el contexto.");
}
