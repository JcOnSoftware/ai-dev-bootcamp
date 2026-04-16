// Docs:
//   SDK README       : https://github.com/openai/openai-node
//   Function Calling : https://platform.openai.com/docs/guides/function-calling
//   API ref          : https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export default async function run(): Promise<{ notes: string[]; turnCount: number }> {
  const client = new OpenAI();

  // Agent's external state — persists across all loop iterations
  const notes: string[] = [];

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "user",
      content:
        "Take a note that I need to buy milk, then take a note about the meeting at 3pm, then list all notes.",
    },
  ];

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "note_taker",
        description: "Add a note or list all existing notes",
        parameters: {
          type: "object",
          properties: {
            action: {
              type: "string",
              enum: ["add_note", "list_notes"],
              description: "The operation to perform",
            },
            text: {
              type: "string",
              description: "The note text (required when action is add_note)",
            },
          },
          required: ["action"],
        },
      },
    },
  ];

  let turnCount = 0;

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
      turnCount++;
      for (const toolCall of choice.message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments) as {
          action: "add_note" | "list_notes";
          text?: string;
        };

        let result: unknown;
        if (args.action === "add_note" && args.text) {
          notes.push(args.text);
          result = { success: true, note: args.text };
        } else if (args.action === "list_notes") {
          result = { notes };
        } else {
          result = { error: "Unknown action or missing text" };
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }
  }

  return { notes, turnCount };
}
