// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

export default async function run(): Promise<ChatCompletion> {
  const client = new OpenAI();

  const response = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 256,
    messages: [
      { role: "user", content: "What's the weather in Tokyo?" },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get the current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and country, e.g. Tokyo, Japan",
              },
              unit: {
                type: "string",
                enum: ["celsius", "fahrenheit"],
                description: "The temperature unit to use",
              },
            },
            required: ["location"],
          },
        },
      },
    ],
  });

  return response;
}
