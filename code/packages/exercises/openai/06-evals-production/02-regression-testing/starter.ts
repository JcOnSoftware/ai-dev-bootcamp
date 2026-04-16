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

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Define 3 test cases as an array of { input: string, expectedPattern: RegExp }:
 *        - { input: "What is the capital of France?", expectedPattern: /paris/i }
 *        - { input: "What is 2 + 2?", expectedPattern: /4|four/i }
 *        - { input: "Name one primary color.", expectedPattern: /red|blue|yellow/i }
 *   3. For each test case, call client.chat.completions.create:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 100
 *        - messages: [{ role: "user", content: testCase.input }]
 *   4. Extract the output text from response.choices[0].message.content.
 *   5. Check if the output matches the expectedPattern (boolean).
 *   6. Build a results array: [{ input, output, passed }].
 *   7. Calculate passRate as (number of passed tests) / (total tests).
 *   8. Return { results, passRate }.
 */
export default async function run(): Promise<{
  results: TestResult[];
  passRate: number;
}> {
  throw new Error("TODO: implement the regression test suite. Read exercise.md for context.");
}
