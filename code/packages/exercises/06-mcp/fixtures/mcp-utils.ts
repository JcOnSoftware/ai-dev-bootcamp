// Shared utilities for bridging MCP and the Anthropic SDK.
//
// Exercise 04 teaches how to write this translator by hand — the starter has
// a TODO for `mcpToolsToAnthropicFormat` and tests assert the learner's own
// implementation. This module exists so exercise 05 (and any future caller)
// can consume the translator without importing from 04's solution, which
// would couple 05's runtime to 04 being solved.

import type Anthropic from "@anthropic-ai/sdk";
import type { Tool as McpTool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Convert MCP tool definitions to the format the Anthropic Messages API expects.
 *
 * Key rename: MCP uses `inputSchema` (camelCase), Anthropic uses `input_schema`
 * (snake_case). Names and descriptions pass through unchanged.
 */
export function mcpToolsToAnthropicFormat(mcpTools: McpTool[]): Anthropic.Tool[] {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Tool["input_schema"],
  }));
}
