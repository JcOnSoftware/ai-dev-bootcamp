// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions API: https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

export default async function run(): Promise<{
  response: ChatCompletion;
  finishReason: string | null;
  wasTruncated: boolean;
}> {
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 50,
    messages: [
      {
        role: "user",
        content: "Write a detailed essay about the history of computing.",
      },
    ],
  });

  const finishReason = response.choices[0]!.finish_reason;
  const wasTruncated = finishReason === "length";

  return { response, finishReason, wasTruncated };
}
