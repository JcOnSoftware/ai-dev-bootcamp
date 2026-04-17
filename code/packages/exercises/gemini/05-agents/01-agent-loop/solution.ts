// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   Multi-turn loop        : https://ai.google.dev/gemini-api/docs/function-calling#multi-turn

import { GoogleGenAI, Type } from "@google/genai";
import type { Content } from "@google/genai";

export interface AgentResult {
  turnCount: number;
  toolCalls: string[];
  answer: string;
}

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

const MAX_TURNS = 6;
const USER_PROMPT = "What is 37 times 42? Use the multiply tool.";

export default async function run(): Promise<AgentResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });
  const tools = [{ functionDeclarations: [MULTIPLY_DECL] }];

  const contents: Content[] = [
    { role: "user", parts: [{ text: USER_PROMPT }] },
  ];
  const toolCalls: string[] = [];
  let turnCount = 0;

  while (turnCount < MAX_TURNS) {
    turnCount += 1;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: { tools, maxOutputTokens: 256 },
    });

    const fc = response.functionCalls ?? [];
    if (fc.length === 0) {
      return { turnCount, toolCalls, answer: response.text ?? "" };
    }

    contents.push({
      role: "model",
      parts: fc.map((c) => ({ functionCall: { name: c.name ?? "", args: c.args ?? {} } })),
    });

    contents.push({
      role: "user",
      parts: fc.map((c) => ({
        functionResponse: {
          name: c.name ?? "",
          response: multiply(c.args as { a: number; b: number }),
        },
      })),
    });

    toolCalls.push(...fc.map((c) => c.name ?? ""));
  }

  throw new Error(`Agent hit MAX_TURNS (${MAX_TURNS}) without a final answer.`);
}
