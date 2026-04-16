// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

function fakeGetWeather(location: string): { location: string; temperature: number; condition: string } {
  const temps: Record<string, number> = {
    Tokyo: 18,
    London: 12,
    "New York": 8,
  };
  return {
    location,
    temperature: temps[location] ?? 20,
    condition: "partly cloudy",
  };
}

export default async function run(): Promise<{ toolCallCount: number; response: ChatCompletion }> {
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
            location: { type: "string", description: "City name, e.g. Tokyo" },
          },
          required: ["location"],
        },
      },
    },
  ];

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: "What's the weather in Tokyo, London, and New York?",
    },
  ];

  // First call — model requests multiple tool calls in parallel
  const firstResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 512,
    messages,
    tools,
    parallel_tool_calls: true,
  });

  const assistantMessage = firstResponse.choices[0]!.message;
  messages.push(assistantMessage);

  const toolCalls = assistantMessage.tool_calls ?? [];

  // Execute ALL tool calls and collect results
  await Promise.all(
    toolCalls.map(async (toolCall) => {
      const args = JSON.parse(toolCall.function.arguments) as { location: string };
      const result = fakeGetWeather(args.location);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }),
  );

  // Second call — model produces final answer with all weather data
  const finalResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 512,
    messages,
    tools,
  });

  return { toolCallCount: toolCalls.length, response: finalResponse };
}
