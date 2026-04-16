// Docs:
//   MCP quickstart (client): https://modelcontextprotocol.io/quickstart/client
//   Claude Messages API:     https://docs.claude.com/en/api/messages
//   MCP architecture:        https://modelcontextprotocol.io/docs/concepts/architecture

import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createResearchServer } from "../fixtures/research-server.ts";
import { mcpToolsToAnthropicFormat } from "../fixtures/mcp-utils.ts";

const anthropic = new Anthropic();

const MODEL = "claude-haiku-4-5-20251001";

/**
 * Run a full agent loop backed by an MCP server for tools.
 *
 * Full circle: the 05-agents loop pattern with executeTool replaced by
 * client.callTool(). The model never knows whether tools are local or remote
 * — MCP is the abstraction. This is the production pattern for AI assistants
 * with external tool servers.
 */
export async function runAgentWithMcpTools(
  question: string,
  maxIterations = 10,
): Promise<{
  finalMessage: string;
  iterations: number;
  toolCalls: { name: string; input: unknown }[];
}> {
  // Set up MCP client
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createResearchServer();
  await server.connect(serverTransport);
  const mcpClient = new Client({ name: "agent-client", version: "1.0.0" });
  await mcpClient.connect(clientTransport);

  // Discover and convert tools
  const { tools: mcpTools } = await mcpClient.listTools();
  const anthropicTools = mcpToolsToAnthropicFormat(mcpTools);

  // Agent loop
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];
  const toolCalls: { name: string; input: unknown }[] = [];
  let iterations = 0;
  let finalMessage = "";

  while (iterations < maxIterations) {
    iterations++;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools: anthropicTools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      finalMessage = textBlock?.type === "text" ? textBlock.text : "";
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

          // MCP replaces the local executeTool() — same interface, remote execution
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
  return { finalMessage, iterations, toolCalls };
}

export default async function run(): Promise<unknown> {
  return runAgentWithMcpTools(
    "Compare the cost multipliers for 5-minute vs 1-hour caching",
  );
}
