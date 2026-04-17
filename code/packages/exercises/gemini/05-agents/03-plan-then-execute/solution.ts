// Docs:
//   Function calling guide : https://ai.google.dev/gemini-api/docs/function-calling
//   System instructions    : https://ai.google.dev/gemini-api/docs/text-generation#system-instructions
//   Response parts         : https://ai.google.dev/api/caching#Part

import { GoogleGenAI, Type } from "@google/genai";
import type { Content } from "@google/genai";

export interface PlanExecuteResult {
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

const TOOL_DECLS = [
  {
    name: "multiply",
    description: "Multiply two numbers.",
    parameters: {
      type: Type.OBJECT,
      properties: { a: { type: Type.NUMBER }, b: { type: Type.NUMBER } },
      required: ["a", "b"],
    },
  },
  {
    name: "add",
    description: "Add two numbers.",
    parameters: {
      type: Type.OBJECT,
      properties: { a: { type: Type.NUMBER }, b: { type: Type.NUMBER } },
      required: ["a", "b"],
    },
  },
];

const DISPATCH: Record<string, (args: Record<string, number>) => unknown> = {
  multiply: (a) => multiply(a as { a: number; b: number }),
  add: (a) => add(a as { a: number; b: number }),
};

const SYSTEM =
  "Always start your response with a one-sentence plan describing which tools you will call and in what order. Then immediately call the tools. Do not execute tools before describing the plan.";

const MAX_TURNS = 6;
const USER_PROMPT = "Compute (8 * 9) + 17 using the tools provided.";

export default async function run(): Promise<PlanExecuteResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });
  const tools = [{ functionDeclarations: TOOL_DECLS }];

  const contents: Content[] = [
    { role: "user", parts: [{ text: USER_PROMPT }] },
  ];
  const toolCalls: string[] = [];
  let firstTurnText = "";
  let turnCount = 0;

  while (turnCount < MAX_TURNS) {
    turnCount += 1;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        tools,
        systemInstruction: SYSTEM,
        maxOutputTokens: 512,
      },
    });

    if (turnCount === 1) {
      firstTurnText = response.text ?? "";
    }

    const fc = response.functionCalls ?? [];
    if (fc.length === 0) {
      return { firstTurnText, toolCalls, answer: response.text ?? "" };
    }

    contents.push({
      role: "model",
      parts: fc.map((c) => ({ functionCall: { name: c.name ?? "", args: c.args ?? {} } })),
    });
    contents.push({
      role: "user",
      parts: fc.map((c) => {
        const result = DISPATCH[c.name ?? ""]?.(c.args as Record<string, number>) as
          | Record<string, unknown>
          | undefined;
        const response: Record<string, unknown> = result ?? { error: `unknown tool: ${c.name}` };
        return { functionResponse: { name: c.name ?? "", response } };
      }),
    });
    toolCalls.push(...fc.map((c) => c.name ?? ""));
  }

  throw new Error(`Agent hit MAX_TURNS (${MAX_TURNS}).`);
}
