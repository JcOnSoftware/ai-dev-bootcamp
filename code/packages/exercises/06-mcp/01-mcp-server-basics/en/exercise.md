# Exercise 01 — MCP Server Basics

## Concept

MCP (Model Context Protocol) is a **protocol**, not a library. It uses JSON-RPC 2.0 over three possible transports: `stdio` (for subprocesses), `SSE` (for HTTP), and `InMemoryTransport` (for tests). The choice of transport does not change the server or client API.

An MCP server exposes three primitives:
- **Tools** — actions the client can execute
- **Resources** — data the client can read
- **Prompts** — reusable message templates

In this exercise you build an echo server with a single tool.

**Critical ADR**: In tests we use `InMemoryTransport.createLinkedPair()` — deterministic, no subprocesses, no port cleanup. In production you'd use `StdioServerTransport`.

**NEVER use `console.log` in MCP server files** — it corrupts the stdio JSON-RPC stream. Always use `console.error`.

## Docs and references

- Quickstart (server): https://modelcontextprotocol.io/quickstart/server
- Architecture: https://modelcontextprotocol.io/docs/concepts/architecture

## Your task

Implement `buildEchoServer()` in `starter.ts`:

1. Create a `new McpServer({ name: "echo-server", version: "1.0.0" })`.
2. Register a tool `"echo"` with `inputSchema: { text: z.string() }`.
3. The handler must return `{ content: [{ type: "text", text }] }`.
4. Return the server (without connecting — the test handles the connection).

## How to verify

```bash
# From code/
AIDEV_TARGET=starter aidev verify 01-mcp-server-basics   # should fail
AIDEV_TARGET=solution aidev verify 01-mcp-server-basics  # should pass
```

Or directly with bun test:

```bash
AIDEV_TARGET=solution bun test packages/exercises/06-mcp/01-mcp-server-basics
```

## What the tests validate

- The server exposes exactly **1 tool**.
- The tool name is `"echo"`.
- `callTool({ name: "echo", arguments: { text: "hello" } })` returns `content[0].text === "hello"`.

## Extra concept

To connect this server to Claude Desktop, add this entry to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "echo-server": {
      "command": "bun",
      "args": ["run", "/path/to/solution.ts"]
    }
  }
}
```

Claude Desktop uses `StdioClientTransport` internally to talk to the server via stdin/stdout.
