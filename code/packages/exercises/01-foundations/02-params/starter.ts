// Docs:
//   SDK README  : https://github.com/anthropics/anthropic-sdk-typescript
//   API ref     : https://platform.claude.com/docs/en/api/messages
//   Model IDs   : https://platform.claude.com/docs/en/docs/about-claude/models/overview

import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

export interface ParamsResult {
  deterministic: Message;
  creative: Message;
}

/**
 * TODO:
 *   1. Instancia un cliente Anthropic.
 *   2. Hacé DOS llamadas a messages.create con un modelo Haiku:
 *        - deterministic: temperature 0, pedile extracción estructurada
 *          (ej: "extraé el nombre y email de: 'Me llamo Juan, email juan@ejemplo.com'").
 *        - creative: temperature >= 0.7, pedile algo creativo
 *          (ej: "Dame 3 títulos creativos para un artículo sobre IA").
 *   3. Ambas con max_tokens ≤ 300.
 *   4. Retorná { deterministic, creative }.
 *
 * Si te trabás: exercise.md sección "Docs & references".
 */
export default async function run(): Promise<ParamsResult> {
  throw new Error("TODO: implementá las dos llamadas. Leé exercise.md para el contexto.");
}
