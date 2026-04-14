// Docs:
//   Models + pricing : https://platform.claude.com/docs/en/docs/about-claude/models/overview
//   API ref (usage)  : https://platform.claude.com/docs/en/api/messages
//   SDK README       : https://github.com/anthropics/anthropic-sdk-typescript

import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

export interface TokensCostResult {
  response: Message;
  costUsd: number;
}

/**
 * TODO:
 *   1. Instancia un cliente Anthropic.
 *   2. Llamá a messages.create con Claude Haiku 4.5 ("claude-haiku-4-5-20251001"),
 *      max_tokens ≤ 300, y un mensaje user con un pedido concreto
 *      (ej: "Explicá en 3 oraciones qué es un Large Language Model").
 *   3. Leé response.usage.input_tokens y response.usage.output_tokens.
 *   4. Calculá costUsd con:
 *        costUsd = (input_tokens  / 1_000_000) * 1   // $1 por MTok input
 *                + (output_tokens / 1_000_000) * 5   // $5 por MTok output
 *   5. Retorná { response, costUsd }.
 *
 * Tip: si te trabás con la fórmula, releé la sección "Concepto" de exercise.md.
 */
export default async function run(): Promise<TokensCostResult> {
  throw new Error("TODO: implementá la llamada y el cálculo de costo. Leé exercise.md.");
}
