# Exploration: add-mcp-track

**Date**: 2026-04-14  
**Change**: `add-mcp-track` (track 06-mcp)  
**Artifact store**: hybrid

---

## Summary

The `@modelcontextprotocol/sdk` v1.29.0 is stable, officially Bun-compatible, and has all the primitives needed for all 5 exercises via clean subpath imports. The SDK ships `InMemoryTransport.createLinkedPair()` — the right testing primitive for exercises 01-03 (no Anthropic calls). Exercises 04-05 use the manual bridging pattern (MCP client → translate → Claude tool_use → MCP execute) which preserves the pedagogical goal of showing the full protocol layer. No Anthropic MCP helper needed.

---

## API Research Findings

### SDK Package

- **Package name**: `@modelcontextprotocol/sdk`
- **Current stable version**: `1.29.0` (npm registry confirmed)
- **License**: MIT
- **Runtime support**: Node.js 18+, Bun (officially listed), Deno
- **Source**: https://www.npmjs.com/package/@modelcontextprotocol/sdk

### Entry Points (confirmed from quickstart TS code)

| Import | Path |
|--------|------|
| High-level server (recommended) | `@modelcontextprotocol/sdk/server/mcp.js` → `McpServer` |
| Low-level server | `@modelcontextprotocol/sdk/server/index.js` → `Server` |
| Stdio server transport | `@modelcontextprotocol/sdk/server/stdio.js` → `StdioServerTransport` |
| Client | `@modelcontextprotocol/sdk/client/index.js` → `Client` |
| Stdio client transport | `@modelcontextprotocol/sdk/client/stdio.js` → `StdioClientTransport` |
| In-memory transport | `@modelcontextprotocol/sdk/inMemory.js` → `InMemoryTransport` |

Wildcard subpath export `"./*"` is defined, so all paths above resolve correctly.

### Server API (`McpServer` — high-level)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "research-server", version: "1.0.0" });

// Register a tool
server.tool(
  "search_docs",
  "Search documentation chunks by keyword",
  { query: z.string(), top_k: z.number().optional() },
  async ({ query, top_k }) => ({
    content: [{ type: "text", text: executeSearch(query, top_k) }]
  })
);

// Register a resource
server.resource("docs://chunks/{id}", "Read a doc chunk by ID", async (uri) => ({
  contents: [{ uri: uri.href, text: readChunk(uri.pathname) }]
}));

// Register a prompt
server.prompt("research-query", "Template for research queries", async (args) => ({
  messages: [{ role: "user", content: { type: "text", text: `Research: ${args.topic}` } }]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
```

Zod schemas are used for tool input — the SDK derives the JSON Schema for the MCP protocol automatically. The `McpServer` high-level API is preferred over the low-level `Server` + `setRequestHandler` pattern.

**Critical gotcha**: In stdio servers, NEVER use `console.log()` — it corrupts JSON-RPC over stdout. Use `console.error()` for any debug output.

### Client API

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "bun",
  args: ["run", "/path/to/server.ts"],
  env: { ...process.env }  // optional
});

const client = new Client({ name: "my-client", version: "1.0.0" });
await client.connect(transport);

// List tools
const { tools } = await client.listTools();

// Call a tool
const result = await client.callTool({ name: "search_docs", arguments: { query: "caching" } });

// List resources
const { resources } = await client.listResources();

// Read a resource
const { contents } = await client.readResource({ uri: "docs://chunks/caching-01" });

// List prompts
const { prompts } = await client.listPrompts();

// Get a prompt
const { messages } = await client.getPrompt({ name: "research-query", arguments: { topic: "tools" } });

// Cleanup
await client.close();
```

`StdioClientTransport` takes `{ command: string, args?: string[], env?: Record<string, string> }`. The client spawns the server as a child process and speaks JSON-RPC over stdio.

### Capabilities Negotiation

On `client.connect()`, the SDK performs:
1. Client sends `initialize` with `{ protocolVersion, capabilities, clientInfo }`
2. Server responds with its own `{ protocolVersion, capabilities, serverInfo }`
3. Client sends `notifications/initialized`

Capabilities advertised by the server indicate which primitives are available (tools, resources, prompts). The SDK handles this automatically.

### InMemoryTransport (for tests)

```typescript
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
// Pass clientTransport to Client, serverTransport to Server
// Both run in the same process — no child process spawning
```

This is the correct transport for exercises 01-03 tests. No subprocesses, no pid cleanup, deterministic teardown.

Sources:
- https://modelcontextprotocol.io/quickstart/server (TypeScript tab)
- https://modelcontextprotocol.io/quickstart/client (TypeScript tab)
- https://modelcontextprotocol.io/docs/concepts/architecture
- https://registry.npmjs.org/@modelcontextprotocol/sdk/latest

---

## Harness + Testing Recommendation

**Decision: `InMemoryTransport` for exercises 01-03; `StdioClientTransport` for exercises 04-05.**

| Exercise | Transport in tests | Reason |
|----------|--------------------|--------|
| 01-mcp-server-basics | InMemoryTransport | Tests only the server; no Claude calls; fastest |
| 02-mcp-client-connect | InMemoryTransport | Tests client API against fixture server |
| 03-resources-and-prompts | InMemoryTransport | Tests resources + prompts; no Claude |
| 04-tools-with-mcp | StdioClientTransport (or InMemory) | Must verify MCP → Claude bridge; InMemory reduces flakiness |
| 05-mcp-in-agent-loop | StdioClientTransport | Realistic end-to-end; fixture server spawned as child |

For 04-05, using InMemoryTransport in tests is actually safer and reduces subprocess management complexity. The stdio experience is preserved in the `solution.ts` (which exercises spawning a real server) while tests use InMemory. This matches the "structure assertions" principle — tests don't need a real subprocess to verify Claude's tool_use blocks and MCP routing.

**Recommendation**: Use InMemoryTransport in ALL test files. The `solution.ts` for 04-05 uses `StdioClientTransport` to demonstrate the realistic pattern.

The harness captures Anthropic SDK `Messages.create` calls. MCP calls are invisible to the harness — this is expected and fine. Tests for 04-05 assert on:
- Claude received translated MCP tool definitions (correct `name`, `description`, `input_schema` shape)
- Response contains a `tool_use` block with the MCP tool name
- After tool execution, final response is a text block (not another tool_use)

---

## Anthropic MCP Helper Decision

**Decision: Manual bridging. No SDK helper.**

The Anthropic docs page redirected to `modelcontextprotocol.io` — the Anthropic SDK does not expose an official `mcp` integration helper in the TypeScript SDK (as of this research). The Python SDK has some helpers, but the TS SDK relies on the learner doing the translation manually.

Even if a helper exists, **manual bridging is the right pedagogy**:
- Learner sees exactly how `tool.inputSchema` from MCP maps to `input_schema` in Claude's `tools` array
- Learner sees how `tool_use.name` + `tool_use.input` map back to `client.callTool({ name, arguments })`
- This is the same philosophy as DIY agent loop in 05-agents

The translation is ~5 lines of code:
```typescript
const claudeTools = mcpTools.map(t => ({
  name: t.name,
  description: t.description ?? "",
  input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
}));
```

---

## Dependency Plan

Add `@modelcontextprotocol/sdk` to `code/package.json` (workspace root) as a **regular dependency**, not devDependency. Exercises import it at runtime.

```json
"dependencies": {
  "@modelcontextprotocol/sdk": "^1.29.0"
}
```

Also add `zod` since `McpServer.tool()` uses Zod schemas for tool input validation:
```json
"dependencies": {
  "@modelcontextprotocol/sdk": "^1.29.0",
  "zod": "^3.25.0"
}
```

Check if `zod` is already in the workspace — if not, add it. The MCP SDK requires `zod ^3.25 || ^4.0` as a peer/dependency.

Location: `code/package.json` workspace root. No per-package granularity needed — all exercises share it.

---

## Proposed 5 Exercises

| # | ID | Title (en) | Core concept | Est. min | API cost |
|---|---|---|---|---|---|
| 1 | `01-mcp-server-basics` | Build Your First MCP Server | `McpServer` + tool registration + stdio transport | 25 | $0 |
| 2 | `02-mcp-client-connect` | Connect an MCP Client | `Client` + `listTools` + `callTool` via stdio | 25 | $0 |
| 3 | `03-resources-and-prompts` | Resources and Prompt Templates | `server.resource()` + `server.prompt()` + client read/get | 30 | $0 |
| 4 | `04-tools-with-mcp` | Bridge MCP Tools to Claude | Manual MCP→Claude tool translation + tool_use routing | 40 | ~$0.005 |
| 5 | `05-mcp-in-agent-loop` | MCP in an Agent Loop | Full agent loop with MCP-backed tools replacing local executeTool | 45 | ~$0.005 |

All 5 bilingual (es + en) from day one.

**Concept progression**: protocol mechanics (01-03) → LLM integration (04) → agentic orchestration (05). Each exercise builds on the previous.

---

## Fixture Decision

**Yes — `06-mcp/fixtures/research-server.ts`**

A shared, canonical MCP server exposing `search_docs` + `read_chunk` tools backed by `05-agents/fixtures/research-tools.ts` (which in turn uses `04-rag/fixtures/docs-chunks.ts`). This:
- Keeps exercises 02, 04, 05 focused on the client-side / bridge / agent patterns
- Maintains cross-track domain continuity (same docs corpus)
- Follows the established fixture convention (`04-rag/fixtures/`, `05-agents/fixtures/`)

Path: `code/packages/exercises/06-mcp/fixtures/research-server.ts`

The fixture exports both a `startServer()` function (for in-process use with InMemoryTransport) and is runnable as a standalone script (for `StdioClientTransport` in solutions).

---

## Cost Estimate

| Exercises | API calls | Cost per learner |
|---|---|---|
| 01-03 | 0 | $0.00 |
| 04 | ~1-2 Haiku calls | ~$0.005 |
| 05 | ~2-4 Haiku calls (agent loop) | ~$0.008 |
| **Total track 06** | | **< $0.015** |

Lowest-cost track. The entire bootcamp (all 6 tracks) stays well under $2 per learner.

---

## Open Questions

1. **Zod version**: The MCP SDK requires `zod ^3.25 || ^4.0`. Check if any existing workspace dep pins an incompatible version.
2. **Bun subprocess with `bun run`**: When using `StdioClientTransport` in solutions, the command should be `"bun"` with `args: ["run", serverPath]` — not `"node"`. This is Bun-specific and must be documented in exercise starters.
3. **TS import paths with `.js` extension**: The SDK uses `.js` subpath imports (`/server/mcp.js`, `/server/stdio.js`). With Bun's `allowImportingTsExtensions`, this might require `// @ts-ignore` or tsconfig adjustment. The existing project uses `verbatimModuleSyntax` — verify `.js` extensions resolve cleanly under Bun without compilation.
4. **InMemoryTransport export path**: Confirmed at `@modelcontextprotocol/sdk/inMemory.js` from the npm unpkg source — double-check this resolves after `bun install`.
5. **`console.log` gotcha in server code**: Must be prominently flagged in exercise starters. Any `console.log` inside the MCP server corrupts the stdio JSON-RPC stream silently.
6. **valid_until**: Set to `2026-10-15` for all 5 exercises (MCP protocol/SDK stability window).

None of these are blockers. Items 3-4 can be verified in 2 minutes with `bun install` + a quick import test.
