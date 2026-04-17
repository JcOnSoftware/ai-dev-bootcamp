// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   Multi-turn loop        : https://ai.google.dev/gemini-api/docs/function-calling#multi-turn

import { GoogleGenAI, Type } from "@google/genai";
import type { Content } from "@google/genai";

export interface AgentResult {
  /** Total generateContent turns the loop performed. */
  turnCount: number;
  /** Names of every function the model invoked across the loop. */
  toolCalls: string[];
  /** Final natural-language answer. */
  answer: string;
}

/** Stubbed tool: "multiply two numbers" — so the model has a reason to call it. */
export function multiply(args: { a: number; b: number }): { product: number } {
  return { product: args.a * args.b };
}

const MULTIPLY_DECL = {
  name: "multiply",
  description: "Multiply two numbers and return the product.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      a: { type: Type.NUMBER },
      b: { type: Type.NUMBER },
    },
    required: ["a", "b"],
  },
};

/**
 * TODO:
 *   Implement the agent loop. Pseudocode:
 *
 *     const contents: Content[] = [{ role: "user", parts: [{ text: userPrompt }] }];
 *     let turnCount = 0;
 *     const toolCalls: string[] = [];
 *     while (turnCount < MAX_TURNS) {
 *       turnCount += 1;
 *       const response = await ai.models.generateContent({
 *         model: "gemini-2.5-flash",
 *         contents,
 *         config: { tools: [{ functionDeclarations: [MULTIPLY_DECL] }], maxOutputTokens: 256 },
 *       });
 *       const fc = response.functionCalls ?? [];
 *       if (fc.length === 0) {
 *         return { turnCount, toolCalls, answer: response.text ?? "" };
 *       }
 *       // Model wants tools. Execute each, append call + result to contents.
 *       const modelParts = fc.map((c) => ({ functionCall: { name: c.name, args: c.args } }));
 *       contents.push({ role: "model", parts: modelParts });
 *       const userParts = fc.map((c) => ({
 *         functionResponse: { name: c.name, response: multiply(c.args as { a: number; b: number }) },
 *       }));
 *       contents.push({ role: "user", parts: userParts });
 *       toolCalls.push(...fc.map((c) => c.name ?? ""));
 *     }
 *     throw new Error("Hit MAX_TURNS without the model producing a final answer.");
 *
 *   User prompt to use: "What is 37 times 42? Use the multiply tool."
 *   MAX_TURNS: 6 (plenty for a simple arithmetic chain).
 */
export default async function run(): Promise<AgentResult> {
  throw new Error("TODO: implement the agent loop. Read exercise.md.");
}
