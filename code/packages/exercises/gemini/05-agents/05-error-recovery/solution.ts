// Docs:
//   Function calling guide  : https://ai.google.dev/gemini-api/docs/function-calling
//   functionResponse shape  : https://ai.google.dev/api/caching#FunctionResponse
//   Error handling prompting: https://ai.google.dev/gemini-api/docs/prompting-strategies

import { GoogleGenAI, Type } from "@google/genai";
import type { Content } from "@google/genai";

export interface RecoveryResult {
  lookupCallCount: number;
  toolCalls: string[];
  answer: string;
}

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

const LOOKUP_DECL = {
  name: "lookup",
  description:
    "Look up data for a given key. May sometimes return an error object with shape { error, message }; if so, retry once.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      key: { type: Type.STRING, description: "The record key to look up." },
    },
    required: ["key"],
  },
};

const MAX_TURNS = 6;
const USER_PROMPT = "Look up 'user_profile' and tell me whether you got the data.";

export default async function run(): Promise<RecoveryResult> {
  resetCallCount();
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });
  const tools = [{ functionDeclarations: [LOOKUP_DECL] }];

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
      return {
        lookupCallCount: getCallCount(),
        toolCalls,
        answer: response.text ?? "",
      };
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
          response:
            c.name === "lookup"
              ? unreliableLookup(c.args as { key: string })
              : { error: `unknown tool: ${c.name}` },
        },
      })),
    });
    toolCalls.push(...fc.map((c) => c.name ?? ""));
  }

  throw new Error(`Agent hit MAX_TURNS (${MAX_TURNS}).`);
}
