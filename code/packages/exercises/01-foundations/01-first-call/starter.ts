import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

/**
 * TODO:
 *   1. Instancia un cliente Anthropic (no hace falta pasarle la API key,
 *      la toma de ANTHROPIC_API_KEY automáticamente).
 *   2. Llamá a client.messages.create con:
 *        - model: un Claude Haiku (ej: "claude-haiku-4-5-20251001")
 *        - max_tokens: ≤ 200
 *        - messages: [{ role: "user", content: "saluda en español brevemente" }]
 *   3. Retorná la respuesta.
 */
export default async function run(): Promise<Message> {
  throw new Error("TODO: implementá la llamada a Claude. Leé exercise.md para el contexto.");
}
