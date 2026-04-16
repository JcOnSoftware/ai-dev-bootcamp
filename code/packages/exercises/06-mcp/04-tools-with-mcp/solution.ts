// Docs:
//   MCP quickstart (client): https://modelcontextprotocol.io/quickstart/client
//   Claude Messages API:     https://docs.claude.com/en/api/messages
//   MCP architecture:        https://modelcontextprotocol.io/docs/concepts/architecture

import Anthropic from "@anthropic-ai/sdk";
import type { Tool as McpTool } from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createResearchServer } from "../fixtures/research-server.ts";

const anthropic = new Anthropic();

const MODEL = "claude-haiku-4-5-20251001";

/**
 * Convert MCP tool definitions to the format the Anthropic API expects.
 *
 * The key difference: MCP uses `inputSchema` (camelCase), Anthropic uses
 * `input_schema` (snake_case). This pure function bridges the two.
 */
export function mcpToolsToAnthropicFormat(mcpTools: McpTool[]): Anthropic.Tool[] {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Tool["input_schema"],
  }));
}

/**
 * Connect to the research MCP server, convert its tools, run a manual bridge
 * loop with Claude, and return the answer plus all tool calls made.
 *
 * In production you'd use client.beta.messages.toolRunner() to abstract this
 * loop — but understanding the manual version first is important.
 */
export async function askClaudeWithMcpTools(
  question: string,
): Promise<{ answer: string; toolCalls: { name: string; input: unknown }[] }> {
  // Set up MCP client
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createResearchServer();
  await server.connect(serverTransport);
  const mcpClient = new Client({ name: "bridge-client", version: "1.0.0" });
  await mcpClient.connect(clientTransport);

  // Discover tools and convert to Anthropic format
  const { tools: mcpTools } = await mcpClient.listTools();
  const anthropicTools = mcpToolsToAnthropicFormat(mcpTools);

  // Bridge loop
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];
  const toolCalls: { name: string; input: unknown }[] = [];

  let answer = "";

  while (true) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools: anthropicTools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      answer = textBlock?.type === "text" ? textBlock.text : "";
      break;
    }

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          toolCalls.push({ name: toolUse.name, input: toolUse.input });
          const mcpResult = await mcpClient.callTool({
            name: toolUse.name,
            arguments: toolUse.input as Record<string, unknown>,
          });
          const mcpContent = mcpResult.content as { type: string; text?: string }[];
          const firstBlock = mcpContent[0];
          return {
            type: "tool_result" as const,
            tool_use_id: toolUse.id,
            content: firstBlock?.type === "text" ? (firstBlock.text ?? "") : JSON.stringify(mcpContent),
          };
        }),
      );

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    throw new Error(`Unexpected stop_reason: ${response.stop_reason}`);
  }

  await mcpClient.close();
  return { answer, toolCalls };
}

export default async function run(): Promise<unknown> {
  return askClaudeWithMcpTools("What's the TTL default for prompt caching?");
}
