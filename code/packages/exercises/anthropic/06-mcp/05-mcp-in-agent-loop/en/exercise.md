# Exercise 05 — MCP in Agent Loop

## Concept

This exercise closes the circle. You take the agent loop from the 05-agents track and replace `executeTool()` (local) with `client.callTool()` (remote via MCP). The model never knows or cares whether tools are local or remote — **MCP is the abstraction layer**.

```
Before (05-agents):   executeTool(name, input)  → local function
Now (06-mcp):         client.callTool({name, arguments: input})  → MCP server
```

The loop is identical. Only where the tool execution comes from changes.

**This is the production pattern** for AI assistants with external tool servers. Claude Desktop, Cursor, and other MCP clients use exactly this pattern.

## Docs and references

- MCP quickstart (client): https://modelcontextprotocol.io/quickstart/client
- Claude Messages API: https://docs.claude.com/en/api/messages
- MCP architecture: https://modelcontextprotocol.io/docs/concepts/architecture

## Your task

Implement `runAgentWithMcpTools(question, maxIterations?)` in `starter.ts`:

1. Setup: `InMemoryTransport` + `createResearchServer()` + `Client`.
2. Discover and convert tools (reuse `mcpToolsToAnthropicFormat` from exercise 04).
3. Agent loop: same as 05-agents, but `client.callTool()` instead of `executeTool()`.
4. Capture `toolCalls` and `iterations` during the loop.
5. Cleanup: `await client.close()`.
6. Return `{ finalMessage, iterations, toolCalls }`.

## How to verify

```bash
AIDEV_TARGET=starter aidev verify 05-mcp-in-agent-loop   # should fail
AIDEV_TARGET=solution aidev verify 05-mcp-in-agent-loop  # should pass (requires ANTHROPIC_API_KEY)
```

## What the tests validate

- `iterations` is between 1 and 10 (inclusive).
- At least 1 tool call was made.
- `finalMessage` contains info about caching cost multipliers.
- `result.calls.length === userReturn.iterations` (the harness captured every call).

## Extra concept

To connect multiple MCP servers simultaneously:

```typescript
// Connect two independent servers
const client1 = new Client({ name: "client1", version: "1.0.0" });
await client1.connect(transport1);
const client2 = new Client({ name: "client2", version: "1.0.0" });
await client2.connect(transport2);

// Merge tool lists
const tools1 = await client1.listTools();
const tools2 = await client2.listTools();
const allTools = mcpToolsToAnthropicFormat([...tools1.tools, ...tools2.tools]);

// The dispatcher knows which client to use by tool name
```
