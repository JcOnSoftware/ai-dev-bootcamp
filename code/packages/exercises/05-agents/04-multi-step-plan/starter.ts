// Docs:
//   Agents overview:        https://docs.claude.com/en/docs/agents-and-tools/overview
//   Prompt engineering:     https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview
//   Tool use overview:      https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview

import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, executeTool } from "../fixtures/research-tools.ts";

const client = new Anthropic();

/**
 * Run an agent that answers a multi-part question using explicit planning.
 *
 * The SYSTEM prompt is the key lever here: instruct Claude to break the
 * question into sub-questions and search for each one separately before
 * synthesizing an answer.
 *
 * @param query         - A multi-part question requiring several searches
 * @param maxIterations - Hard cap (default 10)
 */
export async function runMultiStepAgent(
  query: string,
  maxIterations = 10,
): Promise<Anthropic.Message> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: query },
  ];

  // TODO: define a system prompt that instructs Claude to:
  //   1. Plan its steps (break into sub-questions) before searching.
  //   2. Search for each sub-question separately.
  //   3. Synthesize all findings into a final answer.
  const systemPrompt = ""; // TODO: replace with a planning-focused system prompt

  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // TODO: call client.messages.create with model, max_tokens, system, tools, messages

    // TODO: handle end_turn, tool_use (same loop as 01-agent-loop)

    throw new Error("Not implemented");
  }

  throw new Error(`Agent loop exceeded maxIterations (${maxIterations})`);
}

export default async function run(): Promise<Anthropic.Message> {
  return runMultiStepAgent(
    "Compare prompt caching pricing: how much more expensive is a cache write vs a normal input token, and how much cheaper is a cache read?",
  );
}
