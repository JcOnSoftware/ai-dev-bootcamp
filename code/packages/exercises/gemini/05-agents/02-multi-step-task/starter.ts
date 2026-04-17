// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   Multi-turn loop        : https://ai.google.dev/gemini-api/docs/function-calling#multi-turn

import { GoogleGenAI, Type } from "@google/genai";
import type { Content } from "@google/genai";

export interface MultiStepResult {
  turnCount: number;
  toolCalls: string[];
  answer: string;
}

/** Two stub tools. The task requires CALLING BOTH, IN ORDER. */
export function multiply(args: { a: number; b: number }): { product: number } {
  return { product: args.a * args.b };
}
export function add(args: { a: number; b: number }): { sum: number } {
  return { sum: args.a + args.b };
}

export const TOOL_DECLS = [
  {
    name: "multiply",
    description: "Multiply two numbers and return the product.",
    parameters: {
      type: Type.OBJECT,
      properties: { a: { type: Type.NUMBER }, b: { type: Type.NUMBER } },
      required: ["a", "b"],
    },
  },
  {
    name: "add",
    description: "Add two numbers and return the sum.",
    parameters: {
      type: Type.OBJECT,
      properties: { a: { type: Type.NUMBER }, b: { type: Type.NUMBER } },
      required: ["a", "b"],
    },
  },
];

/**
 * TODO:
 *   Same agent loop as exercise 01, but now the task requires TWO sequential
 *   tool calls:
 *
 *   User prompt: "Compute (12 * 7) + 9 using the tools provided. Show the
 *                 final number."
 *
 *   A good agent calls multiply first, reads the product (84), then calls add
 *   with (84, 9) to get 93. The text answer should mention 93.
 *
 *   Dispatcher helper to save you boilerplate:
 *     const DISPATCH: Record<string, (args: any) => unknown> = {
 *       multiply,
 *       add,
 *     };
 *
 *   Loop pattern identical to exercise 01 — MAX_TURNS: 6, model: "gemini-2.5-flash".
 *   Use config.tools: [{ functionDeclarations: TOOL_DECLS }].
 *
 *   Return { turnCount, toolCalls, answer }.
 */
export default async function run(): Promise<MultiStepResult> {
  throw new Error("TODO: chain multiply + add to compute (12 * 7) + 9. Read exercise.md.");
}
