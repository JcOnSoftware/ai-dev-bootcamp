// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions    : https://platform.openai.com/docs/api-reference/chat/create
//   Structured Outputs  : https://platform.openai.com/docs/guides/structured-outputs

import OpenAI from "openai";

export default async function run(): Promise<{
  output: string;
  score: number;
  reasoning: string;
}> {
  const client = new OpenAI();

  // Call 1: the subject — what we are evaluating
  const subjectResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 300,
    messages: [
      { role: "user", content: "Explain recursion to a 5-year-old." },
    ],
  });

  const output = subjectResponse.choices[0]!.message.content!;

  // Call 2: the judge — grades the subject's output
  const judgeResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 256,
    messages: [
      {
        role: "system",
        content:
          'Rate the following explanation on a scale of 1-5 for clarity and simplicity. Respond with JSON: {"score": <number 1-5>, "reasoning": <string>}',
      },
      { role: "user", content: output },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "evaluation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            reasoning: { type: "string" },
          },
          required: ["score", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const parsed = JSON.parse(judgeResponse.choices[0]!.message.content!) as {
    score: number;
    reasoning: string;
  };

  return { output, score: parsed.score, reasoning: parsed.reasoning };
}
