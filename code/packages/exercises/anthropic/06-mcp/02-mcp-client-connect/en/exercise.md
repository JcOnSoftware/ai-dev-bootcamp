# Exercise 02 — MCP Client Connect

## Concept

An MCP client is a **protocol peer**, not an HTTP client. It doesn't make direct requests to URLs — it speaks JSON-RPC 2.0 to the server over the chosen transport.

The two key client operations:
- **`listTools()`** — discovery: the client asks what tools the server exposes
- **`callTool()`** — invocation: the client executes a specific tool with arguments

The **cleanup pattern** is mandatory. If you don't close the client (and the underlying transport), the test suite may hang waiting for the transport to finish. Always return a `cleanup` function and call it in `afterAll`.

InMemory vs Stdio: client code is identical — only the transport you pass to `client.connect()` changes.

## Docs and references

- Quickstart (client): https://modelcontextprotocol.io/quickstart/client
- Architecture: https://modelcontextprotocol.io/docs/concepts/architecture

## Your task

Implement `connectResearchClient()` in `starter.ts`:

1. Create a transport pair with `InMemoryTransport.createLinkedPair()`.
2. Create and connect the research server to the server transport.
3. Create a new `Client({ name: "research-client", version: "1.0.0" })`.
4. Connect the client to the client transport.
5. Return `{ client, cleanup }` where `cleanup` closes the client.

## How to verify

```bash
AIDEV_TARGET=starter aidev verify 02-mcp-client-connect   # should fail
AIDEV_TARGET=solution aidev verify 02-mcp-client-connect  # should pass
```

## What the tests validate

- `listTools()` returns exactly **2 tools**.
- The names are `search_docs` and `read_chunk` (any order).
- `callTool({ name: "search_docs", arguments: { query: "caching" } })` returns `content[0].type === "text"`.

## Extra concept

To connect a client to a subprocess server (the production pattern):

```typescript
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "bun",
  args: ["run", "path/to/server.ts"],
});
const client = new Client({ name: "my-client", version: "1.0.0" });
await client.connect(transport);
// same API: listTools(), callTool(), etc.
```

The server launches as a subprocess and communicates via stdin/stdout. Never use `console.log` in the server — it corrupts the stream.
