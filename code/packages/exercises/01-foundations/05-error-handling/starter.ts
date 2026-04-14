// Docs:
//   SDK error handling : https://github.com/anthropics/anthropic-sdk-typescript#handling-errors
//   Rate limits        : https://platform.claude.com/docs/en/api/rate-limits
//   API ref            : https://platform.claude.com/docs/en/api/messages

import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

/**
 * TODO 1 — Escribí `withRetry`.
 *
 * Ejecuta `fn()`. Si falla con un error retryable (status 429, 500-599, o
 * nombre APIConnectionError / APIConnectionTimeoutError), esperá
 * baseDelayMs * 2^attempt y reintentá, hasta maxAttempts intentos.
 * Si el error es fatal (auth, bad request, etc.), re-lanzá sin reintentar.
 * Si se agotaron los intentos, re-lanzá el último error.
 *
 * Defaults: maxAttempts = 3, baseDelayMs = 500.
 *
 * Pista: usá `await new Promise((r) => setTimeout(r, ms))` para el delay.
 */
export async function withRetry<T>(
  _fn: () => Promise<T>,
  _options?: RetryOptions,
): Promise<T> {
  throw new Error("TODO: implementá withRetry. Leé exercise.md.");
}

/**
 * TODO 2 — Llamada real envuelta en withRetry.
 *
 *   1. Instancia un cliente Anthropic.
 *   2. Usá `withRetry` para envolver una llamada a Claude Haiku
 *      (`claude-haiku-4-5-20251001`, max_tokens ≤ 200, un user message
 *      corto pidiendo un saludo).
 *   3. Retorná el Message resultante.
 */
export default async function run(): Promise<Message> {
  throw new Error("TODO: usá withRetry para envolver una llamada a Haiku.");
}
