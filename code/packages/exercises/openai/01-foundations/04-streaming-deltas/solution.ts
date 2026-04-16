// Docs:
//   SDK README      : https://github.com/openai/openai-node
//   API ref         : https://platform.openai.com/docs/api-reference/chat/create
//   Streaming guide : https://platform.openai.com/docs/guides/streaming

import OpenAI from "openai";

export default async function run(): Promise<{ chunks: string[]; fullText: string }> {
  const client = new OpenAI();

  const stream = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 128,
    messages: [{ role: "user", content: "Count from 1 to 5, one number per line." }],
    stream: true,
    stream_options: { include_usage: true },
  });

  const chunks: string[] = [];
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) chunks.push(delta);
  }

  return { chunks, fullText: chunks.join("") };
}
