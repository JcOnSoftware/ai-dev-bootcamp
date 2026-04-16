// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions    : https://platform.openai.com/docs/api-reference/chat/create
//   Structured Outputs  : https://platform.openai.com/docs/guides/structured-outputs

import OpenAI from "openai";

interface Scores {
  relevance: number;
  accuracy: number;
  tone: number;
  overall: number;
  feedback: string;
}

export default async function run(): Promise<{ answer: string; scores: Scores }> {
  const client = new OpenAI();

  // Call 1: generate the answer we want to evaluate
  const answerResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 300,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant. Answer concisely and accurately.",
      },
      {
        role: "user",
        content: "What are the main benefits of TypeScript over JavaScript?",
      },
    ],
  });

  const answer = answerResponse.choices[0]!.message.content!;

  // Call 2: multi-criteria scoring with structured output
  const scorerResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You are an expert evaluator. Score the following answer on these criteria (1-5 each): relevance, accuracy, tone. Also provide an overall score and brief feedback.",
      },
      {
        role: "user",
        content: `Question: What are the main benefits of TypeScript over JavaScript?\n\nAnswer: ${answer}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "scoring_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            relevance: { type: "number" },
            accuracy: { type: "number" },
            tone: { type: "number" },
            overall: { type: "number" },
            feedback: { type: "string" },
          },
          required: ["relevance", "accuracy", "tone", "overall", "feedback"],
          additionalProperties: false,
        },
      },
    },
  });

  const scores = JSON.parse(scorerResponse.choices[0]!.message.content!) as Scores;

  return { answer, scores };
}
