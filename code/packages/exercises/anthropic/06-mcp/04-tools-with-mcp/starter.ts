// Docs:
//   MCP quickstart (client): https://modelcontextprotocol.io/quickstart/client
//   Claude Messages API:     https://docs.claude.com/en/api/messages
//   MCP architecture:        https://modelcontextprotocol.io/docs/concepts/architecture

import Anthropic from "@anthropic-ai/sdk";
import type { Tool as McpTool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Convert MCP tool definitions to the format the Anthropic API expects.
 *
 * MCP uses `inputSchema` (camelCase).
 * Anthropic uses `input_schema` (snake_case).
 * This pure function bridges the two.
 */
export function mcpToolsToAnthropicFormat(mcpTools: McpTool[]): Anthropic.Tool[] {
  // TODO: Map each McpTool to an Anthropic.Tool, renaming inputSchema → input_schema.
  throw new Error("TODO: implement mcpToolsToAnthropicFormat()");
}

/**
 * Connect to the research MCP server, convert its tools to Anthropic format,
 * run a manual bridge loop with Claude, and return the answer plus all tool calls made.
 */
export async function askClaudeWithMcpTools(
  question: string,
): Promise<{ answer: string; toolCalls: { name: string; input: unknown }[] }> {
  // TODO: Set up InMemoryTransport + createResearchServer() + Client,
  //       list + convert tools, run the tool-use loop, cleanup, return { answer, toolCalls }.
  throw new Error("TODO: implement askClaudeWithMcpTools()");
}

export default async function run(): Promise<unknown> {
  return askClaudeWithMcpTools("What's the TTL default for prompt caching?");
}
