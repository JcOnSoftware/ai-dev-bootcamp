// Docs:
//   Function calling guide  : https://ai.google.dev/gemini-api/docs/function-calling
//   functionResponse shape  : https://ai.google.dev/api/caching#FunctionResponse
//   Error handling prompting: https://ai.google.dev/gemini-api/docs/prompting-strategies

import { GoogleGenAI, Type } from "@google/genai";
import type { Content } from "@google/genai";

export interface RecoveryResult {
  /** How many times the lookup tool was invoked across the loop. Should be >=2. */
  lookupCallCount: number;
  toolCalls: string[];
  answer: string;
}

/**
 * Deterministic flaky tool: fails on call #1, succeeds on call #2+.
 *
 * You'll read `getCallCount()` in the agent to know whether the real run
 * saw at least one retry.
 */
let _callCount = 0;
export function resetCallCount(): void {
  _callCount = 0;
}
export function getCallCount(): number {
  return _callCount;
}

export function unreliableLookup(args: { key: string }): Record<string, unknown> {
  _callCount += 1;
  if (_callCount === 1) {
    return { error: "timeout", message: "Upstream timed out. You may retry the same lookup." };
  }
  return { value: `data for ${args.key}`, cached: false };
}

/**
 * TODO:
 *   Build the standard agent loop around the `unreliableLookup` tool.
 *
 *   Declaration:
 *     name: "lookup"
 *     description: "Look up data for a given key. May sometimes return an error
 *                   object with shape { error, message }; if so, retry once."
 *     parameters: { key: string (required) }
 *
 *   User prompt: "Look up 'user_profile' and tell me whether you got the data."
 *
 *   Expected behavior:
 *     Turn 1: model calls lookup → returns { error: "timeout", ... }
 *     Turn 2: model retries SAME key → returns { value: ..., cached: false }
 *     Turn 3: model answers naturally (mentioning the retry or the result)
 *
 *   The description's "retry once" hint is deliberate — the model uses the
 *   description to reason about error responses.
 *
 *   Call resetCallCount() at the start so the test starts from call #0.
 *   After the loop, read getCallCount() to report how many invocations happened.
 *
 *   Return { lookupCallCount: getCallCount(), toolCalls, answer }.
 */
export default async function run(): Promise<RecoveryResult> {
  throw new Error("TODO: build the retry-aware agent loop. Read exercise.md.");
}
