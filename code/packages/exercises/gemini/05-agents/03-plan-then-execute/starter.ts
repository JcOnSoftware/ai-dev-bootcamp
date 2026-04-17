// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   System instructions    : https://ai.google.dev/gemini-api/docs/text-generation#system-instructions
//   Response parts         : https://ai.google.dev/api/caching#Part

import { GoogleGenAI, Type } from "@google/genai";
import type { Content } from "@google/genai";

export interface PlanExecuteResult {
  /** Text the model emitted on the FIRST turn (the plan, before any tool calls). */
  firstTurnText: string;
  toolCalls: string[];
  answer: string;
}

export function multiply(args: { a: number; b: number }): { product: number } {
  return { product: args.a * args.b };
}
export function add(args: { a: number; b: number }): { sum: number } {
  return { sum: args.a + args.b };
}

/**
 * TODO:
 *   Build on the agent loop. This time, force the model to output a PLAN
 *   BEFORE it starts calling tools by using a system instruction.
 *
 *   System instruction (exact text recommended):
 *     "Always start your response with a one-sentence plan describing which
 *      tools you will call and in what order. Then immediately call the tools.
 *      Do not execute tools before describing the plan."
 *
 *   User prompt: "Compute (8 * 9) + 17 using the tools provided."
 *
 *   Loop as usual. First turn's response will contain BOTH:
 *     - text parts (the plan)
 *     - functionCall parts (the first tool invocation)
 *
 *   Capture the first turn's text and return it. Run the full loop and
 *   return the final answer.
 *
 *   Hint: the SDK exposes response.text on mixed responses — it concatenates
 *   all text parts. Perfect for capturing the plan.
 */
export default async function run(): Promise<PlanExecuteResult> {
  throw new Error("TODO: implement plan-then-execute with a system instruction. Read exercise.md.");
}
