// Docs:
//   Agents overview:        https://docs.claude.com/en/docs/agents-and-tools/overview
//   Tool use overview:      https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Implement tool use:     https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, executeTool } from "../fixtures/research-tools.ts";

const client = new Anthropic();

/**
 * Run a basic agent loop with a hard iteration cap.
 *
 * The loop must:
 *   1. Send the user query to Claude with AGENT_TOOLS.
 *   2. If stop_reason === "tool_use", execute each tool and feed results back.
 *   3. Repeat until stop_reason === "end_turn" OR iterations reach maxIterations.
 *   4. Return the final API response.
 *
 * @param query       - The user's question to answer
 * @param maxIterations - Hard cap to prevent infinite loops (default: 10)
 */
export async function runAgentLoop(
  query: string,
  maxIterations = 10,
): Promise<Anthropic.Message> {
  // TODO: initialise the messages array with the user query

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // TODO: call client.messages.create with model, max_tokens, tools, messages

    // TODO: if stop_reason === "end_turn", return the response

    // TODO: if stop_reason === "tool_use":
    //   - find all tool_use blocks in response.content
    //   - for each: call executeTool(block.name, block.input) → string result
    //   - push the assistant response onto messages
    //   - push a user message with tool_result blocks back onto messages

    // TODO: handle unexpected stop_reason (throw or return)
  }

  throw new Error(`Agent loop exceeded maxIterations (${maxIterations})`);
}

export default async function run(): Promise<Anthropic.Message> {
  return runAgentLoop("What is prompt caching and how much does a cache read cost?");
}
