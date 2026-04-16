// Docs:
//   SDK README          : https://github.com/openai/openai-node
//   Chat Completions API: https://platform.openai.com/docs/api-reference/chat/create

import OpenAI from "openai";
import type { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * TODO:
 *   1. Create an OpenAI client.
 *   2. Build 2 normal turns (user + assistant each), accumulating messages:
 *      - Turn 1: "I am building a TypeScript REST API using Express and PostgreSQL."
 *      - Turn 2: "I want to add authentication using JWT tokens."
 *   3. Make a summarization call: add one more user message asking the model to
 *      "Summarize our conversation so far in exactly one sentence."
 *      Capture the response text as `summary`.
 *   4. Start a NEW conversation using the summary as context:
 *      - system: `Context from previous conversation: ${summary}`
 *      - user: "What should I implement next?"
 *      This is `finalResponse`.
 *   5. Return { summary, finalResponse }
 *
 *   Use model: "gpt-4.1-nano" and max_completion_tokens: 128 (64 for summary call).
 */
export default async function run(): Promise<{
  summary: string;
  finalResponse: ChatCompletion;
}> {
  throw new Error("TODO: implement the summarization-loops exercise. Read exercise.md for context.");
}
