// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions API: https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";

export default async function run(): Promise<{
  originalCount: number;
  truncatedCount: number;
  response: ChatCompletion;
}> {
  const client = new OpenAI();

  // Build a long conversation with a system message + 10 user/assistant exchanges
  const systemMessage: ChatCompletionMessageParam = {
    role: "system",
    content: "You are a helpful assistant that discusses programming topics.",
  };

  const history: ChatCompletionMessageParam[] = [
    { role: "user", content: "What is a variable?" },
    { role: "assistant", content: "A variable is a named storage location that holds a value which can change during program execution." },
    { role: "user", content: "What is a function?" },
    { role: "assistant", content: "A function is a reusable block of code that performs a specific task and can be called multiple times." },
    { role: "user", content: "What is a loop?" },
    { role: "assistant", content: "A loop is a control structure that repeats a block of code while a condition is true or for a specified number of iterations." },
    { role: "user", content: "What is an array?" },
    { role: "assistant", content: "An array is an ordered collection of elements of the same type, accessible by their numeric index." },
    { role: "user", content: "What is a class?" },
    { role: "assistant", content: "A class is a blueprint for creating objects that bundles related data and behavior together." },
  ];

  const originalCount = 1 + history.length; // system + 10 messages

  // Truncation strategy: keep system message + last 3 exchanges (6 messages)
  const lastN = 6;
  const truncatedHistory = history.slice(-lastN);
  const truncatedMessages: ChatCompletionMessageParam[] = [systemMessage, ...truncatedHistory];
  const truncatedCount = truncatedMessages.length;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 128,
    messages: truncatedMessages,
  });

  return { originalCount, truncatedCount, response };
}
