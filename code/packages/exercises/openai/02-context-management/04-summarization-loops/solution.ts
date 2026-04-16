// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions API: https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";

export default async function run(): Promise<{
  summary: string;
  finalResponse: ChatCompletion;
}> {
  const client = new OpenAI();

  const messages: ChatCompletionMessageParam[] = [];

  // Turn 1: establish some context
  messages.push({ role: "user", content: "I am building a TypeScript REST API using Express and PostgreSQL." });
  const r1 = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 128,
    messages: [...messages],
  });
  messages.push({ role: "assistant", content: r1.choices[0]!.message.content ?? "" });

  // Turn 2: add more context
  messages.push({ role: "user", content: "I want to add authentication using JWT tokens." });
  const r2 = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 128,
    messages: [...messages],
  });
  messages.push({ role: "assistant", content: r2.choices[0]!.message.content ?? "" });

  // Summarize the conversation so far in one sentence
  const summaryMessages: ChatCompletionMessageParam[] = [
    ...messages,
    {
      role: "user",
      content: "Summarize our conversation so far in exactly one sentence.",
    },
  ];
  const summaryResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 64,
    messages: summaryMessages,
  });
  const summary = summaryResponse.choices[0]!.message.content ?? "";

  // Start fresh with only the summary as context
  const finalResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 128,
    messages: [
      {
        role: "system",
        content: `Context from previous conversation: ${summary}`,
      },
      {
        role: "user",
        content: "What should I implement next?",
      },
    ],
  });

  return { summary, finalResponse };
}
