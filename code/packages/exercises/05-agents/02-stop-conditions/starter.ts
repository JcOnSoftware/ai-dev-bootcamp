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
 *
 * @param stopReason    - response.stop_reason
 * @param content       - response.content blocks
 * @param iterations    - current iteration count
 * @param maxIterations - hard cap
 */
export function evaluateStop(
  _stopReason: string,
  _content: Array<{ type: string }>,
  _iterations: number,
  _maxIterations: number,
): "goal" | "end_turn" | "max_iterations" | null {
  // TODO: implement the 4-way priority check described above
  return null;
}

/**
 * Run the agent loop with layered stop conditions.
 *
 * Returns { stoppedReason, calls } so callers (and tests) can see WHY it stopped.
 */
export async function runWithStopConditions(
  query: string,
  maxIterations = 10,
): Promise<{ stoppedReason: string; calls: number; finalResponse: Anthropic.Message | null }> {
  // TODO: initialise messages, run loop, call evaluateStop each iteration
  return { stoppedReason: "not-implemented", calls: 0, finalResponse: null };
}

export default async function run() {
  return runWithStopConditions(
    "What is prompt caching and what are its pricing multipliers?",
  );
}
