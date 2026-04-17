// Docs:
//   Code execution guide : https://ai.google.dev/gemini-api/docs/code-execution
//   Built-in tools       : https://ai.google.dev/gemini-api/docs/function-calling#built-in-tools
//   Part shape           : https://ai.google.dev/api/caching#Part

import { GoogleGenAI } from "@google/genai";

export interface CodeExecResult {
  /** The Python source the model generated. */
  generatedCode: string;
  /** The stdout / result the sandbox returned. */
  sandboxOutput: string;
  /** The model's natural-language wrap-up. */
  summary: string;
}

/**
 * TODO:
 *   Enable the built-in `codeExecution` tool. The model will write Python,
 *   Google runs it in a sandbox, and the model then explains the result.
 *
 *   1. Call ai.models.generateContent({
 *        model: "gemini-2.5-flash",
 *        contents: "Compute 17 * 23 and the sum of the first 100 integers. Show the Python you ran.",
 *        config: { tools: [{ codeExecution: {} }], maxOutputTokens: 600 },
 *      })
 *
 *   2. The response's candidates[0].content.parts has THREE kinds of parts:
 *        - { executableCode: { language, code } }     — the Python source
 *        - { codeExecutionResult: { outcome, output } } — the sandbox output
 *        - { text: "..." }                            — the model's wrap-up
 *
 *      Walk the parts and separate them into the three fields in CodeExecResult.
 *      If multiple text parts exist, concatenate. If multiple executableCode
 *      parts exist, join with "\n\n".
 *
 *   3. Return { generatedCode, sandboxOutput, summary }.
 */
export default async function run(): Promise<CodeExecResult> {
  throw new Error("TODO: enable code execution and split the response parts. Read exercise.md.");
}
