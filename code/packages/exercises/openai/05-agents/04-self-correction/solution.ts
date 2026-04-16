// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

function fakeDivide(a: number, b: number): { result?: number; error?: string } {
  if (b === 0) return { error: "Error: division by zero" };
  return { result: a / b };
}

export default async function run(): Promise<{
  results: Array<{ result?: number; error?: string }>;
  hadError: boolean;
}> {
  const client = new OpenAI();

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: "Calculate 100/5 and then 100/0, handle any errors gracefully.",
    },
  ];

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "divide",
        description: "Divide two numbers. Returns an error if the divisor is zero.",
        parameters: {
          type: "object",
          properties: {
            a: { type: "number", description: "The dividend" },
            b: { type: "number", description: "The divisor" },
          },
          required: ["a", "b"],
        },
      },
    },
  ];

  const results: Array<{ result?: number; error?: string }> = [];
  let hadError = false;

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
      break;
    }

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments) as { a: number; b: number };
        const divResult = fakeDivide(args.a, args.b);

        results.push(divResult);
        if (divResult.error) {
          hadError = true;
        }

        // Always send the result (including errors) back to the model
        // so it can reason about it and respond gracefully
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(divResult),
        });
      }
    }
  }

  return { results, hadError };
}
