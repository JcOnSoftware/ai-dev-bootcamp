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

const MAX_TURNS_PER_QUESTION = 6;

async function runAgent(
  ai: GoogleGenAI,
  contents: Content[],
  toolsUsed: string[],
): Promise<{ answer: string; turnsRun: number }> {
  const tools = [{ functionDeclarations: TOOL_DECLS }];
  let turnsRun = 0;

  while (turnsRun < MAX_TURNS_PER_QUESTION) {
    turnsRun += 1;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: { tools, maxOutputTokens: 256 },
    });

    const fc = response.functionCalls ?? [];
    if (fc.length === 0) {
      // Record the final model turn in history so subsequent user turns see it.
      contents.push({ role: "model", parts: [{ text: response.text ?? "" }] });
      return { answer: response.text ?? "", turnsRun };
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
    toolsUsed.push(...fc.map((c) => c.name ?? ""));
  }

  throw new Error("Hit per-question MAX_TURNS.");
}

export default async function run(): Promise<MemoryResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const contents: Content[] = [];
  const toolsUsed: string[] = [];

  // --- User turn 1 --------------------------------------------------------
  contents.push({ role: "user", parts: [{ text: "Multiply 6 and 7 using the tool." }] });
  const { answer: firstAnswer, turnsRun: t1 } = await runAgent(ai, contents, toolsUsed);

  // --- User turn 2 (appended to the SAME contents) ------------------------
  contents.push({ role: "user", parts: [{ text: "Now add 8 to that number." }] });
  const { answer: secondAnswer, turnsRun: t2 } = await runAgent(ai, contents, toolsUsed);

  return {
    firstAnswer,
    secondAnswer,
    totalTurns: t1 + t2,
    toolsUsed,
  };
}
