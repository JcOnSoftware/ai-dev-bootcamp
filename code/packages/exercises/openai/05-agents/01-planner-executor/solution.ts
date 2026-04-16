// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

function fakeSearchWeb(_query: string): string {
  return "3600 seconds per hour";
}

function fakeCalculate(expression: string): number {
  const sanitized = expression.replace(/[^0-9+\-*/().]/g, "");
  return Function(`"use strict"; return (${sanitized})`)() as number;
}

export default async function run(): Promise<{ steps: number; finalAnswer: string }> {
  const client = new OpenAI();

  const messages: ChatCompletionMessageParam[] = [
    { role: "user", content: "How many seconds are in 3.5 hours?" },
  ];

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "search_web",
        description: "Search the web for factual information",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "The search query" },
          },
          required: ["query"],
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
              description: "A math expression, e.g. '3.5 * 3600'",
            },
          },
          required: ["expression"],
        },
      },
    },
  ];

  let steps = 0;
  let finalAnswer = "";

  // Agent loop: think -> act -> observe -> repeat
  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      max_completion_tokens: 512,
      messages,
      tools,
    });

    const choice = response.choices[0]!;
    messages.push(choice.message);

    if (choice.finish_reason === "stop") {
      finalAnswer = choice.message.content ?? "";
      break;
    }

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      steps++;
      for (const toolCall of choice.message.tool_calls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments) as Record<string, string>;

        let result: unknown;
        if (name === "search_web") {
          result = fakeSearchWeb(args["query"] ?? "");
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

  return { steps, finalAnswer };
}
