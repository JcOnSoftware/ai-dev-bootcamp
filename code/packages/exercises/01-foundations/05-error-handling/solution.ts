import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

function isRetryable(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { status?: unknown; name?: unknown };
  if (e.status === 429) return true;
  if (typeof e.status === "number" && e.status >= 500 && e.status < 600) return true;
  if (e.name === "APIConnectionError" || e.name === "APIConnectionTimeoutError") return true;
  return false;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err)) throw err;
      if (attempt === maxAttempts - 1) break;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastError;
}

export default async function run(): Promise<Message> {
  const client = new Anthropic();
  return withRetry(() =>
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 128,
      messages: [{ role: "user", content: "Saludá brevemente en español." }],
    }),
  );
}
