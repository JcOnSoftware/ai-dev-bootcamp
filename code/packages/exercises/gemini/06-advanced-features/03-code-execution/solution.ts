// Docs:
//   Code execution guide : https://ai.google.dev/gemini-api/docs/code-execution
//   Built-in tools       : https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools
//   Part shape           : https://ai.google.dev/api/caching#Part

import { GoogleGenAI } from "@google/genai";

export interface CodeExecResult {
  generatedCode: string;
  sandboxOutput: string;
  summary: string;
}

export default async function run(): Promise<CodeExecResult> {
  const ai = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:
      "Compute 17 * 23 and the sum of the first 100 integers. Show the Python you ran.",
    config: {
      tools: [{ codeExecution: {} }],
      maxOutputTokens: 600,
    },
  });

  const parts = (response.candidates?.[0]?.content?.parts ?? []) as Array<Record<string, unknown>>;

  const codes: string[] = [];
  const outputs: string[] = [];
  const texts: string[] = [];

  for (const p of parts) {
    if (p["executableCode"] && typeof p["executableCode"] === "object") {
      const ec = p["executableCode"] as { code?: string };
      if (typeof ec.code === "string") codes.push(ec.code);
    } else if (p["codeExecutionResult"] && typeof p["codeExecutionResult"] === "object") {
      const er = p["codeExecutionResult"] as { output?: string };
      if (typeof er.output === "string") outputs.push(er.output);
    } else if (typeof p["text"] === "string") {
      texts.push(p["text"] as string);
    }
  }

  return {
    generatedCode: codes.join("\n\n"),
    sandboxOutput: outputs.join("\n"),
    summary: texts.join("\n"),
  };
}
