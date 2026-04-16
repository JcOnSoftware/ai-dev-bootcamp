// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions    : https://platform.openai.com/docs/api-reference/chat/create
//   Model IDs           : https://platform.openai.com/docs/models

import OpenAI from "openai";

interface TestCase {
  input: string;
  expectedPattern: RegExp;
}

interface TestResult {
  input: string;
  output: string;
  passed: boolean;
}

export default async function run(): Promise<{
  results: TestResult[];
  passRate: number;
}> {
  const client = new OpenAI();

  const testCases: TestCase[] = [
    { input: "What is the capital of France?", expectedPattern: /paris/i },
    { input: "What is 2 + 2?", expectedPattern: /4|four/i },
    { input: "Name one primary color.", expectedPattern: /red|blue|yellow/i },
  ];

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      max_completion_tokens: 100,
      messages: [{ role: "user", content: testCase.input }],
    });

    const output = response.choices[0]!.message.content ?? "";
    const passed = testCase.expectedPattern.test(output);

    results.push({ input: testCase.input, output, passed });
  }

  const passRate = results.filter((r) => r.passed).length / results.length;

  return { results, passRate };
}
