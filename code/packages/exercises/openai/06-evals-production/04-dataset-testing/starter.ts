// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions    : https://platform.openai.com/docs/api-reference/chat/create
//   Model IDs           : https://platform.openai.com/docs/models

import OpenAI from "openai";

interface DatasetEntry {
  prompt: string;
  expectedContains: string[];
}

interface EvalResult {
  prompt: string;
  output: string;
  passed: boolean;
}

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Define a dataset inline as an array of 5 DatasetEntry objects:
 *        [
 *          { prompt: "What is the capital of France?", expectedContains: ["Paris"] },
 *          { prompt: "What is the capital of Germany?", expectedContains: ["Berlin"] },
 *          { prompt: "What is the capital of Japan?", expectedContains: ["Tokyo"] },
 *          { prompt: "What is the capital of Australia?", expectedContains: ["Canberra"] },
 *          { prompt: "What is the capital of Brazil?", expectedContains: ["Brasilia", "Brasília"] },
 *        ]
 *   3. For each entry, call client.chat.completions.create:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 100
 *        - messages: [{ role: "user", content: entry.prompt }]
 *   4. Extract the output text.
 *   5. Check if the output contains ALL strings in expectedContains (case-insensitive).
 *      A string is "contained" if output.toLowerCase().includes(expected.toLowerCase()).
 *   6. Build an EvalResult for each entry: { prompt, output, passed }.
 *   7. Compute:
 *        - totalTests: dataset.length (5)
 *        - passed: count of results where passed === true
 *        - failed: count of results where passed === false
 *        - accuracy: passed / totalTests
 *   8. Return { totalTests, passed, failed, accuracy }.
 */
export default async function run(): Promise<{
  totalTests: number;
  passed: number;
  failed: number;
  accuracy: number;
}> {
  throw new Error("TODO: implement dataset-driven batch evaluation. Read exercise.md for context.");
}
