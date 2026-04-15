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
 * Think → Act → Observe, repeated until Claude signals it is done (end_turn)
 * or the hard cap is reached.
 *
 * @param query         - The user's question to answer
 * @param maxIterations - Hard cap to prevent infinite loops (default: 10)
 */
export async function runAgentLoop(
  query: string,
  maxIterations = 10,
): Promise<Anthropic.Message> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: query },
  ];

  let iterations = 0;
  let response: Anthropic.Message | null = null;

  while (iterations < maxIterations) {
    iterations++;

    response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      tools: [...AGENT_TOOLS],
      messages,
    });

    // ── Stop condition: done ──────────────────────────────────────────────────
    if (response.stop_reason === "end_turn") {
      return response;
    }

    // ── Act: execute tool calls ───────────────────────────────────────────────
    if (response.stop_reason === "tool_use") {
      // Append assistant response to conversation
      messages.push({ role: "assistant", content: response.content });

      // Execute each tool and collect results
      const toolResults: Anthropic.ToolResultBlockParam[] = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
        .map((toolUse) => ({
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: executeTool(toolUse.name, toolUse.input),
        }));

      // Feed results back as a new user message
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // ── Unexpected stop reason ────────────────────────────────────────────────
    throw new Error(`Unexpected stop_reason: ${response.stop_reason}`);
  }

  throw new Error(`Agent loop exceeded maxIterations (${maxIterations})`);
}

export default async function run(): Promise<Anthropic.Message> {
  return runAgentLoop("What is prompt caching and how much does a cache read cost?");
}
