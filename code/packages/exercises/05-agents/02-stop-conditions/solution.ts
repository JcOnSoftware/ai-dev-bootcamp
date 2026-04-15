// Docs:
//   Agents overview:        https://docs.claude.com/en/docs/agents-and-tools/overview
//   Tool use overview:      https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview
//   Implement tool use:     https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use

import Anthropic from "@anthropic-ai/sdk";
import { AGENT_TOOLS, executeTool } from "../fixtures/research-tools.ts";

const client = new Anthropic();

/**
 * Pure function: decide whether the agent loop should stop.
 *
 * Check order (priority):
 *   1. max_iterations — if iterations >= maxIterations → "max_iterations"
 *   2. goal           — if stop_reason is end_turn AND text contains "FINAL ANSWER:" → "goal"
 *   3. end_turn       — if stop_reason is end_turn → "end_turn"
 *   4. null           — keep looping
 */
export function evaluateStop(
  stopReason: string,
  content: Array<{ type: string; text?: string }>,
  iterations: number,
  maxIterations: number,
): "goal" | "end_turn" | "max_iterations" | null {
  // Priority 1: hard cap
  if (iterations >= maxIterations) return "max_iterations";

  // Priority 2: goal signal in text content
  if (stopReason === "end_turn") {
    const textBlock = content.find((b) => b.type === "text");
    if (textBlock?.text?.includes("FINAL ANSWER:")) return "goal";
    // Priority 3: normal end
    return "end_turn";
  }

  // Priority 4: keep looping
  return null;
}

/**
 * Run the agent loop with layered stop conditions.
 *
 * Returns { stoppedReason, calls, finalResponse } so callers can inspect WHY
 * the loop stopped — useful for monitoring and debugging agents.
 */
export async function runWithStopConditions(
  query: string,
  maxIterations = 10,
): Promise<{ stoppedReason: string; calls: number; finalResponse: Anthropic.Message | null }> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: query,
    },
  ];

  let iterations = 0;
  let finalResponse: Anthropic.Message | null = null;

  while (iterations < maxIterations) {
    iterations++;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:
        "You are a helpful assistant. When you have enough information to answer the user's question completely, start your final answer with 'FINAL ANSWER:' on its own line.",
      tools: [...AGENT_TOOLS],
      messages,
    });

    finalResponse = response;

    const stopDecision = evaluateStop(
      response.stop_reason ?? "",
      response.content as Array<{ type: string; text?: string }>,
      iterations,
      maxIterations,
    );

    if (stopDecision !== null) {
      return { stoppedReason: stopDecision, calls: iterations, finalResponse };
    }

    // Continue: execute tool calls and append to conversation
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = response.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
      .map((toolUse) => ({
        type: "tool_result" as const,
        tool_use_id: toolUse.id,
        content: executeTool(toolUse.name, toolUse.input),
      }));

    messages.push({ role: "user", content: toolResults });
  }

  return { stoppedReason: "max_iterations", calls: iterations, finalResponse };
}

export default async function run() {
  return runWithStopConditions(
    "What is prompt caching and what are its pricing multipliers?",
  );
}
