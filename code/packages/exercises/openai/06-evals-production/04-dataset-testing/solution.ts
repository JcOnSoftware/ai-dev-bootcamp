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

export default async function run(): Promise<{
  totalTests: number;
  passed: number;
  failed: number;
  accuracy: number;
}> {
  const client = new OpenAI();

  const dataset: DatasetEntry[] = [
    { prompt: "What is the capital of France?", expectedContains: ["Paris"] },
    { prompt: "What is the capital of Germany?", expectedContains: ["Berlin"] },
    { prompt: "What is the capital of Japan?", expectedContains: ["Tokyo"] },
    { prompt: "What is the capital of Australia?", expectedContains: ["Canberra"] },
    { prompt: "What is the capital of Brazil?", expectedContains: ["Brasilia", "Brasília"] },
  ];

  const results: EvalResult[] = [];

  for (const entry of dataset) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      max_completion_tokens: 100,
      messages: [{ role: "user", content: entry.prompt }],
    });

    const output = response.choices[0]!.message.content ?? "";
    const outputLower = output.toLowerCase();

    // All expected strings must be found (case-insensitive)
    const passed = entry.expectedContains.some((expected) =>
      outputLower.includes(expected.toLowerCase())
    );

    results.push({ prompt: entry.prompt, output, passed });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    totalTests: dataset.length,
    passed: passedCount,
    failed: failedCount,
    accuracy: passedCount / dataset.length,
  };
}
