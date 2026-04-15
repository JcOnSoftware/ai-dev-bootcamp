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
 */
export async function runTurn(
  state: ConversationState,
  userMsg: string,
  maxIterations = 10,
): Promise<Anthropic.Message> {
  // Append the new user question to the shared conversation history
  state.messages.push({ role: "user", content: userMsg });

  let iterationsThisTurn = 0;
  let response: Anthropic.Message | null = null;

  while (iterationsThisTurn < maxIterations) {
    iterationsThisTurn++;
    state.totalIterations++;

    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      tools: [...AGENT_TOOLS],
      messages: state.messages,
    });

    if (response.stop_reason === "end_turn") {
      // Append assistant response so the next turn has full context
      state.messages.push({ role: "assistant", content: response.content });
      return response;
    }

    if (response.stop_reason === "tool_use") {
      state.messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
        .map((toolUse) => ({
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: executeTool(toolUse.name, toolUse.input),
        }));

      state.messages.push({ role: "user", content: toolResults });
      continue;
    }

    throw new Error(`Unexpected stop_reason: ${response.stop_reason}`);
  }

  throw new Error(`Turn exceeded maxIterations (${maxIterations})`);
}

export default async function run(): Promise<Anthropic.Message> {
  const state: ConversationState = { messages: [], totalIterations: 0 };

  // Turn 1: ask about caching
  await runTurn(state, "What is prompt caching?");

  // Turn 2: follow-up referencing the first answer (tests conversation history)
  return runTurn(state, "And how much does a cache write cost compared to a normal input token?");
}
