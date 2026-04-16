// Docs:
//   Agents overview:        https://docs.claude.com/en/docs/agents-and-tools/overview
//   Tool use overview:      https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Tool results:           https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, executeTool } from "../fixtures/research-tools.ts";

const client = new Anthropic();

const SELF_CORRECTION_SYSTEM_PROMPT = `You are a research assistant with access to documentation search tools.

IMPORTANT ERROR HANDLING RULE: If any tool returns a JSON object containing an "error" field, you MUST try a DIFFERENT approach rather than retrying the same call. For example:
- If read_chunk returns an error for a given ID, use search_docs to find a valid ID first, then read a different chunk.
- If search_docs returns an empty array, try different search keywords.

Never give up after a single error — always attempt recovery with a different strategy.`;

/**
 * Run an agent that recovers gracefully from tool errors.
 *
 * The query deliberately includes a non-existent chunk ID. The system prompt
 * instructs Claude to detect the error response and try a different approach.
 * Tests verify that at least one tool_result contains an error AND that
 * read_chunk was called with at least 2 different IDs (recovery happened).
 */
export async function runSelfCorrecting(
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
      system: SELF_CORRECTION_SYSTEM_PROMPT,
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
  // The query deliberately asks Claude to read a non-existent chunk ID first
  // so it encounters an error and must self-correct by trying a different ID.
  return runSelfCorrecting(
    "Read chunk 'nonexistent-id' and tell me what it says. If that doesn't work, search for information about tool use and read a relevant chunk instead.",
  );
}
