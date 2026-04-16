# Exercise 04 — Tools with MCP

## Concept

To use MCP tools with the Claude API, there's a **naming gap** to bridge manually:

| Field | MCP | Anthropic API |
|-------|-----|---------------|
| Input schema | `inputSchema` (camelCase) | `input_schema` (snake_case) |

This renaming is the "seam" between the two protocols. In this exercise you implement it by hand — before using high-level helpers — so you understand exactly what's happening.

**The 3-step bridge loop**:
1. `client.listTools()` → get tools from MCP server
2. `mcpToolsToAnthropicFormat()` → convert to Anthropic format
3. Loop: `messages.create()` → if `stop_reason === "tool_use"` → `client.callTool()` → feed result → continue until `end_turn`

## Docs and references

- MCP quickstart (client): https://modelcontextprotocol.io/quickstart/client
- Claude Messages API: https://docs.claude.com/en/api/messages
- MCP architecture: https://modelcontextprotocol.io/docs/concepts/architecture

## Your task

1. Implement `mcpToolsToAnthropicFormat(mcpTools)` — pure function, no side effects.
2. Implement `askClaudeWithMcpTools(question)` — setup MCP client, convert tools, bridge loop, cleanup.
3. Use model `claude-haiku-4-5-20251001` (exact — tests verify this).

## How to verify

```bash
AIDEV_TARGET=starter aidev verify 04-tools-with-mcp   # should fail
AIDEV_TARGET=solution aidev verify 04-tools-with-mcp  # should pass (requires ANTHROPIC_API_KEY)
```

## What the tests validate

**Unit** (no API key needed):
- `mcpToolsToAnthropicFormat` preserves names and descriptions.
- The result field is named `input_schema`, NOT `inputSchema`.

**Integration** (requires API key):
- At least 1 tool call was made.
- The final answer has more than 30 characters.
- The model used matches `/haiku/i`.

## Extra concept

In production you can use the Anthropic SDK's high-level helper:

```typescript
const result = await client.beta.messages.toolRunner({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 1024,
  tools: anthropicTools,
  messages: [{ role: "user", content: question }],
  // the SDK handles the loop automatically
});
```

Learn the manual loop first. Understand the mechanics before using the abstraction.
