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
  void location;
  return { temperature: 15, condition: "cloudy" };
}

function fakeGetTime(timezone: string): { time: string; timezone: string } {
  void timezone;
  return { time: "14:30", timezone };
}

function fakeCalculate(expression: string): { result: number } {
  // Very limited eval — safe for tests
  const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
  try {
    // biome-ignore lint/security/noEval: intentional fake calculator for exercise
    const result = eval(sanitized) as number;
    return { result };
  } catch {
    return { result: 0 };
  }
}

type ToolName = "get_weather" | "get_time" | "calculate";

function dispatchTool(name: ToolName, args: Record<string, string>): unknown {
  switch (name) {
    case "get_weather":
      return fakeGetWeather(args["location"] ?? "");
    case "get_time":
      return fakeGetTime(args["timezone"] ?? "");
    case "calculate":
      return fakeCalculate(args["expression"] ?? "");
  }
}

export default async function run(): Promise<ChatCompletion> {
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
    {
      type: "function",
      function: {
        name: "get_time",
        description: "Get the current time in a timezone",
        parameters: {
          type: "object",
          properties: {
            timezone: { type: "string", description: "IANA timezone, e.g. Asia/Tokyo" },
          },
          required: ["timezone"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "calculate",
        description: "Evaluate a mathematical expression",
        parameters: {
          type: "object",
          properties: {
            expression: { type: "string", description: "Math expression, e.g. '15 * 7'" },
          },
          required: ["expression"],
        },
      },
    },
  ];

  const messages: ChatCompletionMessageParam[] = [
    { role: "user", content: "What time is it in Tokyo and what's 15 * 7?" },
  ];

  // First call — model requests tool(s)
  const firstResponse = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    max_completion_tokens: 512,
    messages,
    tools,
  });

  const assistantMessage = firstResponse.choices[0]!.message;
  messages.push(assistantMessage);

  // Execute requested tools
  if (assistantMessage.tool_calls) {
    for (const toolCall of assistantMessage.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments) as Record<string, string>;
      const result = dispatchTool(toolCall.function.name as ToolName, args);
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
