// Docs:
//   Agents overview:        https://docs.claude.com/en/docs/agents-and-tools/overview
//   Tool use overview:      https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Tool results:           https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, executeTool } from "../fixtures/research-tools.ts";

const client = new Anthropic();

/**
 * Run an agent that recovers gracefully from tool errors.
 *
 * The query deliberately includes a non-existent chunk ID in the prompt.
 * The system prompt instructs Claude: if a tool returns { error }, try a
 * DIFFERENT approach rather than retrying the same call.
 *
 * @param query         - A question that will trigger a read_chunk error
 * @param maxIterations - Hard cap (default 10)
 */
export async function runSelfCorrecting(
  query: string,
  maxIterations = 10,
): Promise<Anthropic.Message> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: query },
  ];

  // TODO: define a system prompt that tells Claude:
  //   "If any tool returns { error }, you MUST try a DIFFERENT approach
  //    rather than retrying the same call."
  const systemPrompt = ""; // TODO: replace with error-recovery instruction

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // TODO: implement the agent loop (same as 01-agent-loop but with systemPrompt)

    throw new Error("Not implemented");
  }

  throw new Error(`Agent loop exceeded maxIterations (${maxIterations})`);
}

export default async function run(): Promise<Anthropic.Message> {
  // The query deliberately asks Claude to read a non-existent chunk ID first
  // so it encounters an error and must self-correct.
  return runSelfCorrecting(
    "Read chunk 'nonexistent-id' and tell me what it says. If that doesn't work, search for information about tool use and read a relevant chunk instead.",
  );
}
