// Docs:
//   MCP quickstart (client): https://modelcontextprotocol.io/quickstart/client
//   Claude Messages API:     https://docs.claude.com/en/api/messages
//   MCP architecture:        https://modelcontextprotocol.io/docs/concepts/architecture

import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

/**
 * Run a full agent loop backed by an MCP server for tools.
 *
 * This is the full-circle exercise: the 05-agents loop pattern, but with
 * `executeTool` replaced by `client.callTool()`. The model doesn't know or
 * care whether tools are local or remote — MCP is the abstraction.
 *
 * @param question      - User question to answer
 * @param maxIterations - Hard cap to prevent infinite loops (default: 10)
 */
export async function runAgentWithMcpTools(
  question: string,
  maxIterations = 10,
): Promise<{
  finalMessage: string;
  iterations: number;
  toolCalls: { name: string; input: unknown }[];
}> {
  // TODO: Set up InMemoryTransport + createResearchServer() + Client,
  //       convert tools, run the full agent loop using client.callTool() as executeTool,
  //       cleanup, and return { finalMessage, iterations, toolCalls }.
  throw new Error("TODO: implement runAgentWithMcpTools()");
}

export default async function run(): Promise<unknown> {
  return runAgentWithMcpTools(
    "Compare the cost multipliers for 5-minute vs 1-hour caching",
  );
}
