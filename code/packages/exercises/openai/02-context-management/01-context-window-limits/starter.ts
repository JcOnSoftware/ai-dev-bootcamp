// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions API: https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Call client.chat.completions.create with:
 *        - model: "gpt-4.1-nano"
 *        - max_completion_tokens: 50   ← intentionally small
 *        - messages: [{ role: "user", content: "Write a detailed essay about the history of computing." }]
 *   3. Read response.choices[0].finish_reason
 *   4. Set wasTruncated = (finishReason === "length")
 *   5. Return { response, finishReason, wasTruncated }
 */
export default async function run(): Promise<{
  response: ChatCompletion;
  finishReason: string | null;
  wasTruncated: boolean;
}> {
  throw new Error("TODO: implement the context-window-limits exercise. Read exercise.md for context.");
}
