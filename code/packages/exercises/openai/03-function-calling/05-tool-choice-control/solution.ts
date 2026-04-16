// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

export default async function run(): Promise<{
  autoResult: ChatCompletion;
  requiredResult: ChatCompletion;
  noneResult: ChatCompletion;
}> {
  const client = new OpenAI();

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather for a location",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string", description: "City and country" },
          },
          required: ["location"],
        },
      },
    },
  ];

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "user", content: "What's the weather in Paris?" },
  ];

  // Call 1: auto — model decides whether to call a tool
  const autoResult = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 256,
    messages,
    tools,
    tool_choice: "auto",
  });

  // Call 2: required — model MUST call a tool
  const requiredResult = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 256,
    messages,
    tools,
    tool_choice: "required",
  });

  // Call 3: none — model must NOT call any tool
  const noneResult = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 256,
    messages,
    tools,
    tool_choice: "none",
  });

  return { autoResult, requiredResult, noneResult };
}
