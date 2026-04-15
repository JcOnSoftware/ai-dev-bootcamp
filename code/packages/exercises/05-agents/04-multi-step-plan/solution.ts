// Docs:
//   Agents overview:        https://docs.claude.com/en/docs/agents-and-tools/overview
//   Prompt engineering:     https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
//   Tool use overview:      https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview

import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, executeTool } from "../fixtures/research-tools.ts";

const client = new Anthropic();

const PLANNING_SYSTEM_PROMPT = `You are a research assistant with access to documentation search tools.

When answering a question:
1. PLAN your steps first — break the question into sub-questions.
2. Search for each sub-question SEPARATELY using the search_docs tool.
3. Read the relevant chunks using read_chunk for full details.
4. Synthesize all findings into a comprehensive final answer.

Do NOT try to answer everything in a single search. Break complex questions into multiple targeted searches.`;

/**
 * Run an agent that answers a multi-part question using explicit planning.
 *
 * The system prompt instructs Claude to decompose the question into
 * sub-questions and search for each one separately — this reliably produces
 * multiple distinct search_docs calls, which the tests verify.
 */
export async function runMultiStepAgent(
  query: string,
  maxIterations = 10,
): Promise<Anthropic.Message> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: query },
  ];

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: PLANNING_SYSTEM_PROMPT,
      tools: [...AGENT_TOOLS],
      messages,
    });

    if (response.stop_reason === "end_turn") {
      return response;
    }

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
        .map((toolUse) => ({
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: executeTool(toolUse.name, toolUse.input),
        }));

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    throw new Error(`Unexpected stop_reason: ${response.stop_reason}`);
  }

  throw new Error(`Agent loop exceeded maxIterations (${maxIterations})`);
}

export default async function run(): Promise<Anthropic.Message> {
  return runMultiStepAgent(
    "Compare prompt caching pricing: how much more expensive is a cache write vs a normal input token, and how much cheaper is a cache read?",
  );
}
