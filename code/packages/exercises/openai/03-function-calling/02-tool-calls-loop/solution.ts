// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

function fakeGetWeather(location: string): { temperature: number; condition: string } {
  // Simulated tool — no real API call
  void location;
  return { temperature: 22, condition: "sunny" };
}

export default async function run(): Promise<ChatCompletion> {
  const client = new OpenAI();

  const messages: ChatCompletionMessageParam[] = [
    { role: "user", content: "What's the weather in Buenos Aires?" },
  ];

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
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
              description: "The city and country, e.g. Buenos Aires, Argentina",
            },
          },
          required: ["location"],
        },
      },
    },
  ];

  // First call — model requests tool
  const firstResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 512,
    messages,
    tools,
  });

  const assistantMessage = firstResponse.choices[0]!.message;
  messages.push(assistantMessage);

  // Execute each tool call and append results
  if (assistantMessage.tool_calls) {
    for (const toolCall of assistantMessage.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments) as { location: string };
      const result = fakeGetWeather(args.location);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Second call — model produces final answer
  const finalResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 512,
    messages,
    tools,
  });

  return finalResponse;
}
