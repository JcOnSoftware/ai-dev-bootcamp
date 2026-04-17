// Docs:
//   Multi-turn conversation : https://ai.google.dev/gemini-api/docs/text-generation#multi-turn-conversations
//   Function calling loop   : https://ai.google.dev/gemini-api/docs/function-calling#multi-turn
//   Content + roles         : https://ai.google.dev/api/caching#Content

import { GoogleGenAI, Type } from "@google/genai";
import type { Content } from "@google/genai";

export interface MemoryResult {
  firstAnswer: string;
  secondAnswer: string;
  totalTurns: number;
  toolsUsed: string[];
}

export function multiply(args: { a: number; b: number }): { product: number } {
  return { product: args.a * args.b };
}
export function add(args: { a: number; b: number }): { sum: number } {
  return { sum: args.a + args.b };
}

/**
 * TODO:
 *   Simulate a 2-user-turn conversation. The agent must REMEMBER the result
 *   of the first turn so it can answer the follow-up that references "that".
 *
 *   Conversation:
 *     User (turn 1): "Multiply 6 and 7 using the tool."
 *     Agent:        [calls multiply → 42] → answers with 42
 *     User (turn 2): "Now add 8 to that number."
 *     Agent:        [reads 42 from history, calls add(42, 8) → 50] → answers 50
 *
 *   Implementation:
 *     1. Build a SINGLE `contents` array that accumulates across BOTH user turns.
 *        Appending the second user message is literally
 *          contents.push({ role: "user", parts: [{ text: followUp }] })
 *        AFTER the first agent loop finished.
 *     2. Run the agent loop TWICE (once per user question), sharing the same
 *        `contents` array. The model sees full history on turn 2.
 *     3. Return { firstAnswer, secondAnswer, totalTurns, toolsUsed }.
 */
export default async function run(): Promise<MemoryResult> {
  throw new Error("TODO: implement two-user-turn conversation with shared contents. Read exercise.md.");
}
