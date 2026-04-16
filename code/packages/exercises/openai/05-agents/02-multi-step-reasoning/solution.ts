// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

function fakeGetPopulation(city: string): { city: string; population: number } {
  const data: Record<string, number> = {
    Tokyo: 13960000,
    London: 8982000,
  };
  return { city, population: data[city] ?? 0 };
}

function fakeGetArea(city: string): { city: string; areaKm2: number } {
  const data: Record<string, number> = {
    Tokyo: 2194,
    London: 1572,
  };
  return { city, areaKm2: data[city] ?? 0 };
}

function fakeCalculate(expression: string): number {
  const sanitized = expression.replace(/[^0-9+\-*/().]/g, "");
  return Function(`"use strict"; return (${sanitized})`)() as number;
}

export default async function run(): Promise<{ totalCalls: number; finalAnswer: string }> {
  const client = new OpenAI();

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: "Which city has higher population density: Tokyo or London?",
    },
  ];

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "get_population",
        description: "Get the population of a city",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "City name, e.g. Tokyo" },
          },
          required: ["city"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "get_area",
        description: "Get the area of a city in square kilometers",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "City name, e.g. Tokyo" },
          },
          required: ["city"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "calculate",
        description: "Evaluate a mathematical expression and return the numeric result",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "A math expression, e.g. '13960000 / 2194'",
            },
          },
          required: ["expression"],
        },
      },
    },
  ];

  let apiCallCount = 0;
  let finalAnswer = "";

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      max_completion_tokens: 512,
      messages,
      tools,
    });
    apiCallCount++;

    const choice = response.choices[0]!;
    messages.push(choice.message);

    if (choice.finish_reason === "stop") {
      finalAnswer = choice.message.content ?? "";
      break;
    }

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments) as Record<string, string>;

        let result: unknown;
        if (name === "get_population") {
          result = fakeGetPopulation(args["city"] ?? "");
        } else if (name === "get_area") {
          result = fakeGetArea(args["city"] ?? "");
        } else if (name === "calculate") {
          result = fakeCalculate(args["expression"] ?? "");
        } else {
          result = "Unknown tool";
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }
  }

  return { totalCalls: apiCallCount, finalAnswer };
}
