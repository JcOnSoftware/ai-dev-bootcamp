// Docs:
//   Agents overview:        https://docs.claude.com/en/docs/agents-and-tools/overview
//   Tool use overview:      https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Implement tool use:     https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, executeTool } from "../fixtures/research-tools.ts";

const client = new Anthropic();

/**
 * Conversation state — local to this exercise (ADR-8: don't lift to fixture).
 *
 * The Anthropic API is stateless: every request must include the full
 * conversation history. Your code owns this state — there's no server-side
 * session to resume.
 */
export type ConversationState = {
  messages: Anthropic.MessageParam[];
  totalIterations: number;
};

/**
 * Run one "turn" of the conversation.
 *
 * A turn = one user question answered completely (potentially multiple API
 * calls internally to resolve tool uses). The messages array is mutated in-place
 * to accumulate history across turns.
 *
 * @param state   - mutable conversation state (messages + iteration count)
 * @param userMsg - the user's next question
 * @param maxIterations - per-turn hard cap
 */
export async function runTurn(
  state: ConversationState,
  userMsg: string,
  maxIterations = 10,
): Promise<Anthropic.Message> {
  // TODO: push userMsg onto state.messages as a user message
  // TODO: run the agent loop for this turn, updating state.messages and state.totalIterations
  // TODO: return the final response for this turn
  throw new Error("Not implemented");
}

export default async function run(): Promise<Anthropic.Message> {
  const state: ConversationState = { messages: [], totalIterations: 0 };

  // Turn 1: ask about caching
  await runTurn(state, "What is prompt caching?");

  // Turn 2: follow-up referencing the first answer (tests conversation history)
  return runTurn(state, "And how much does a cache write cost compared to a normal input token?");
}
