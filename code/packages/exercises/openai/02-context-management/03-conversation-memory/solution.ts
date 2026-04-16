// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions API: https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";

export default async function run(): Promise<{
  turns: number;
  finalResponse: ChatCompletion;
}> {
  const client = new OpenAI();

  const messages: ChatCompletionMessageParam[] = [];

  // Turn 1: introduce a name
  messages.push({ role: "user", content: "My name is Ada." });
  const response1 = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 64,
    messages: [...messages],
  });
  messages.push({
    role: "assistant",
    content: response1.choices[0]!.message.content ?? "",
  });

  // Turn 2: ask the model to recall the name
  messages.push({ role: "user", content: "What's my name?" });
  const response2 = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 64,
    messages: [...messages],
  });
  messages.push({
    role: "assistant",
    content: response2.choices[0]!.message.content ?? "",
  });

  // Turn 3: ask the model to use the name in a new way
  messages.push({ role: "user", content: "Say my name backwards." });
  const finalResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 64,
    messages: [...messages],
  });

  return { turns: 3, finalResponse };
}
