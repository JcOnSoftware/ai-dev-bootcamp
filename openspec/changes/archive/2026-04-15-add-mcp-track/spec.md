# Spec: add-mcp-track

Change: `add-mcp-track`
Track slug: `06-mcp`
Generation model: `claude-haiku-4-5-20251001` (exercises 04–05 only)
Status: spec
Date: 2026-04-14

---

## Shared fixture contract

**Path**: `code/packages/exercises/06-mcp/fixtures/research-server.ts`

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeSearchDocs, executeReadChunk } from "../../05-agents/fixtures/research-tools.ts";

// CRITICAL: Do NOT use console.log in this file — it corrupts stdio JSON-RPC.
// Use console.error for any diagnostic output instead.

/**
 * Factory — returns a configured McpServer with search_docs + read_chunk tools.
 * Pure — no side effects until `.connect(transport)` is called.
 */
export function createResearchServer(): McpServer;
```

**Server configuration**:
- Server name: `"research-server"`, version: `"1.0.0"`.
- Registers `search_docs` tool with Zod schema `{ query: z.string(), top_k: z.number().optional() }`. Handler delegates to `executeSearchDocs(input)`, returns `{ content: [{ type: "text", text: JSON.stringify(result) }] }`.
- Registers `read_chunk` tool with Zod schema `{ id: z.string() }`. Handler delegates to `executeReadChunk(input)`, returns `{ content: [{ type: "text", text: result }] }`.
- Prominent `console.log` corruption comment at top of file (mandatory invariant, checked in 01 tests).

**Upstream exports used** (confirmed from `05-agents/fixtures/research-tools.ts`):
- `executeSearchDocs(input: { query: string; top_k?: number }): string` — returns JSON string of `[{ id, topic, source }]`.
- `executeReadChunk(input: { id: string }): string` — returns JSON of `{ id, content, metadata }` or `{ error }`.

**Upstream field shape** (confirmed from `04-rag/fixtures/docs-chunks.ts`):
- `Chunk.text` — full chunk content (NOT `.content`).
- `Chunk.metadata.source`: `"prompt-caching-docs" | "tool-use-docs"`.
- `Chunk.metadata.source` values used in soft assertions: `"prompt-caching"` is NOT a valid value — tests must reference actual values (`"prompt-caching-docs"`, `"tool-use-docs"`).

---

## Helper / API contract per exercise

### `01-mcp-server-basics` — minimal server

**Goal**: Build the simplest possible MCP server, connect via InMemoryTransport, exercise the client↔server protocol without any API calls.

**Exports**:
```ts
export function buildEchoServer(): McpServer;
// Server name: "echo-server", version: "1.0.0".
// Registers one tool "echo" with Zod schema { message: z.string() }.
// Handler returns { content: [{ type: "text", text: message }] }.

export default async function run(): Promise<unknown>;
// Creates server + InMemoryTransport.createLinkedPair(), connects both sides,
// calls echo tool with message "hello", returns the content result.
```

**Server registration example** (starter must demonstrate this exact pattern):
```ts
server.tool(
  "echo",
  "Echoes the input message back.",
  { message: z.string() },
  async ({ message }) => ({
    content: [{ type: "text", text: message }],
  }),
);
```

**Assertions** (no API key needed — pure MCP):
- `client.listTools()` returns a list with `length === 1` containing `name === "echo"`.
- `client.callTool({ name: "echo", arguments: { message: "hello" } })` returns `content[0].text === "hello"`.
- Server name accessible via `server.server.name === "echo-server"` (or equivalent SDK accessor).
- The `console.log` corruption comment is present in `solution.ts` (string assertion in unit test block).

---

### `02-mcp-client-connect` — client side

**Goal**: Learn to pair `Client` with `InMemoryTransport`, discover server capabilities via `listTools`, and call a tool.

**Exports**:
```ts
export async function connectResearchClient(): Promise<{
  client: Client;
  cleanup: () => Promise<void>;
}>;
// Creates Client + InMemoryTransport.createLinkedPair() with createResearchServer().
// Returns connected client + a cleanup function that calls client.close().

export default async function run(): Promise<{
  tools: Tool[];
  searchResult: CallToolResult;
}>;
// Connects, lists tools, calls search_docs({ query: "caching" }),
// calls cleanup in finally, returns { tools, searchResult }.
```

**Assertions**:
- `result.userReturn.tools.length === 2`.
- Tool names set equals `{ "search_docs", "read_chunk" }` (order-agnostic, use Set comparison).
- Every tool has `inputSchema` with `type === "object"` and non-empty `properties`.
- `result.userReturn.searchResult.content[0].type === "text"`.
- The text content is a JSON string parseable to an array of `{ id, topic, source }` objects.
- Soft semantic: at least one result has `source === "prompt-caching-docs"` for query `"caching"` (uses actual `metadata.source` value — NOT `"prompt-caching"`).

---

### `03-resources-and-prompts` — beyond tools

**Goal**: Understand MCP Resources and Prompt Templates as first-class protocol primitives distinct from Tools.

**Exports**:
```ts
export function buildDocsResourceServer(): McpServer;
// Server name: "docs-resource-server", version: "1.0.0".
// Resource template: "docs://chunks/{id}" — reads chunk by id from DOCS_CHUNKS.
// Resource list: "docs://index" — returns array of { id, topic } for all chunks.
// Prompt template: "summarize_docs" — takes { topic: string },
//   returns messages: [{ role: "user", content: { type: "text", text: "Summarize the following Anthropic documentation about {topic}..." } }]

export default async function run(): Promise<{
  resources: ListResourcesResult;
  indexContent: ReadResourceResult;
  promptResult: GetPromptResult;
}>;
// Connects with InMemoryTransport to buildDocsResourceServer(),
// lists resources, reads "docs://index", gets "summarize_docs" with { topic: "caching" }.
```

**Assertions**:
- Resource list includes `docs://index` resource OR a `docs://chunks/{id}` template pattern.
- Reading `docs://index` returns content with at least 5 items listed (subset of DOCS_CHUNKS).
- Prompt list includes a prompt named `"summarize_docs"`.
- Getting the prompt with `{ topic: "caching" }` returns messages containing `"caching"` (soft substring check).
- All clients `.close()`d in `afterAll`.

---

### `04-tools-with-mcp` — Claude ↔ MCP bridge

**Goal**: Manually translate MCP tool descriptors to Anthropic SDK format, build the bridge loop.

**Exports**:
```ts
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export function mcpToolsToAnthropicFormat(mcpTools: Tool[]): Anthropic.Tool[];
// Pure function. Maps: { name, description, inputSchema } → { name, description, input_schema }.
// Key rename only — no semantic transformation.

export async function askClaudeWithMcpTools(question: string): Promise<{
  answer: string;
  toolCalls: Array<{ name: string; input: unknown; result: string }>;
}>;
// Full bridge:
//   1. Connect MCP client to createResearchServer() via InMemoryTransport.
//   2. listTools() → translate via mcpToolsToAnthropicFormat().
//   3. Call Claude with translated tools (model: claude-haiku-4-5-20251001).
//   4. On tool_use → call mcpClient.callTool() → append tool_result → loop until end_turn.
//   5. Return final text answer + list of { name, input, result } for each tool dispatch.
//   6. Calls client.close() in finally.

export default async function run(): Promise<{
  answer: string;
  toolCalls: Array<{ name: string; input: unknown; result: string }>;
}>;
// run() asks: "What's the TTL default for prompt caching?"
```

**Assertions**:

Unit (no API key):
- `mcpToolsToAnthropicFormat([{ name: "a", description: "desc a", inputSchema: { type: "object", properties: { x: { type: "string" } } } }, { name: "b", description: "desc b", inputSchema: { type: "object", properties: {} } }])` produces output with preserved names, descriptions, and `input_schema` matching original `inputSchema` values.
- Output array `length === 2`.

Integration (`beforeAll` guard on `ANTHROPIC_API_KEY`):
- `result.userReturn.toolCalls.length >= 1`.
- `result.userReturn.toolCalls[0].name` is either `"search_docs"` or `"read_chunk"`.
- `result.userReturn.answer.length > 30`.
- `result.calls[0].request.tools.length === 2` (translated from MCP).
- `result.calls[0].request.tools` contains entries with `name: "search_docs"` and `name: "read_chunk"`.
- `result.calls[0].request.model` matches `/haiku/i`.

---

### `05-mcp-in-agent-loop` — capstone

**Goal**: Replace 05-agents' hardcoded `executeTool` with a live MCP client, demonstrating that the agent loop is transport-agnostic.

**Exports**:
```ts
export async function runAgentWithMcpTools(
  question: string,
  maxIterations?: number  // default 10
): Promise<{
  finalMessage: Anthropic.Message;
  iterations: number;
  toolCalls: Array<{ name: string; input: unknown }>;
}>;
// Manual agent loop from 05-agents/01-agent-loop pattern,
// but executeTool is replaced by: mcpClient.callTool({ name, arguments: input }).
// MCP client connected to createResearchServer() via InMemoryTransport.
// Closes client in finally.
// Model: claude-haiku-4-5-20251001.

export default async function run(): Promise<{
  finalMessage: Anthropic.Message;
  iterations: number;
  toolCalls: Array<{ name: string; input: unknown }>;
}>;
// run() asks: "Compare the cost multipliers for 5-minute vs 1-hour caching"
```

**Assertions** (`beforeAll` guard on `ANTHROPIC_API_KEY`):
- `result.userReturn.iterations >= 1 && result.userReturn.iterations <= 10`.
- `result.userReturn.toolCalls.length >= 1`.
- Soft semantic: final answer text matches at least one of: `"1.25"`, `"2"`, `"25%"`, `"100%"` — cache multiplier forms from `DOCS_CHUNKS`.
- `result.calls.length` equals `result.userReturn.iterations` (one Claude call per iteration).
- Every `result.calls[i].request.tools` array has `length === 2` with names `"search_docs"` and `"read_chunk"`.
- `result.calls[0].request.model` matches `/haiku/i`.

---

## Starter contract

Each `starter.ts`:

1. `// Docs:` header with canonical URLs:
```ts
// Docs:
//   MCP server quickstart   : https://modelcontextprotocol.io/quickstart/server
//   MCP client quickstart   : https://modelcontextprotocol.io/quickstart/client
//   MCP architecture        : https://modelcontextprotocol.io/docs/concepts/architecture
//   Claude Messages API     : https://docs.claude.com/en/api/messages
```
   - Exercises 01, 03: include `quickstart/server` + `architecture`.
   - Exercise 02: include `quickstart/client` + `architecture`.
   - Exercises 04, 05: include `architecture` + `docs.claude.com/en/api/messages`.

2. **Prominent comment in EVERY server-side file** (01, 02 fixture usage, 03, 04, 05):
```ts
// CRITICAL: Do NOT use console.log in MCP servers — it corrupts stdio JSON-RPC.
// Use console.error for any diagnostic output instead.
```

3. Exports all named helpers as TODO-throwing stubs with correct typed signatures.

4. Exports `default async function run()` that throws `new Error("TODO: implementa run()")`.

5. Imports `z` from `"zod"` in any file that registers server tools.

6. Solutions use `StdioClientTransport` with `{ command: "bun", args: ["run", "<path>"] }` as the production transport pattern (comments in 02, 04, 05 solutions).

7. Tests use `InMemoryTransport.createLinkedPair()` — never spawn subprocesses.

8. Locale-neutral code — no prose in starter/solution TS files.

---

## Test structure

### Transport rule
- **Exercises 01–03**: No Anthropic API. Pure MCP via `InMemoryTransport.createLinkedPair()`. No `ANTHROPIC_API_KEY` guard needed.
- **Exercises 04–05**: Hybrid. `InMemoryTransport` for MCP layer; real Anthropic API for Claude. `beforeAll` guards `ANTHROPIC_API_KEY`.

### Cleanup rule
All MCP clients created in tests **must** call `.close()` in `afterAll` to avoid dangling transports. This is not optional — leaking transports causes test suite hangs.

### No subprocess tests
No `StdioClientTransport` / child_process in `tests.test.ts`. All InMemory.

### Guard pattern (04–05)
```ts
beforeAll(() => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Integration tests require ANTHROPIC_API_KEY");
  }
});
```

### Assertion patterns (inherited from bootcamp convention)
- Range assertions for iteration counts: `>= N && <= 10`. NEVER exact counts.
- Soft semantic checks on text: regex or substring. NEVER literal LLM output equality.
- Model name: match `/haiku/i`. Never hardcoded string comparison.
- Tool name assertions: `Array.find(t => t.name === "search_docs")`. Never positional index.

### Test organization per file
```
tests.test.ts
├── describe("unit — mcpToolsToAnthropicFormat", () => { ... })   // 04 only, no API
└── describe("integration — <exercise>", () => {
      beforeAll(() => { /* guard ANTHROPIC_API_KEY for 04-05 */ });
      test("...", async () => { ... });
      afterAll(async () => { /* client.close() */ });
    })
```

---

## Track structure

### Directory layout
```
code/packages/exercises/06-mcp/
├── fixtures/
│   └── research-server.ts          ← shared factory
├── 01-mcp-server-basics/
│   ├── es/exercise.md
│   ├── en/exercise.md
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   └── meta.json
├── 02-mcp-client-connect/
│   └── (same structure)
├── 03-resources-and-prompts/
│   └── (same structure)
├── 04-tools-with-mcp/
│   └── (same structure)
└── 05-mcp-in-agent-loop/
    └── (same structure)
```

### `meta.json` fields per exercise

| Field | Value |
|---|---|
| `id` | directory name (e.g. `"01-mcp-server-basics"`) |
| `track` | `"06-mcp"` |
| `title` | Human-readable, matches exercise.md H1 |
| `version` | `"1.0.0"` |
| `valid_until` | `"2026-10-15"` |
| `locales` | `["es", "en"]` |
| `concepts` | see table below |
| `estimated_minutes` | see table below |
| `requires` | see chain below |
| `model_cost_hint` | see table below |

### `requires` dependency chain

| Exercise | `requires` |
|---|---|
| `01-mcp-server-basics` | `["01-first-call"]` |
| `02-mcp-client-connect` | `["01-mcp-server-basics"]` |
| `03-resources-and-prompts` | `["02-mcp-client-connect"]` |
| `04-tools-with-mcp` | `["03-resources-and-prompts"]` |
| `05-mcp-in-agent-loop` | `["04-tools-with-mcp"]` |

### `concepts` tags per exercise

| Exercise | `concepts` |
|---|---|
| `01-mcp-server-basics` | `["mcp-server", "tool-registration", "inmemory-transport", "json-rpc", "stdio-gotcha"]` |
| `02-mcp-client-connect` | `["mcp-client", "listTools", "callTool", "capabilities-negotiation", "transport"]` |
| `03-resources-and-prompts` | `["mcp-resources", "mcp-prompts", "resource-templates", "prompt-templates", "beyond-tools"]` |
| `04-tools-with-mcp` | `["mcp-bridge", "tool-translation", "claude-integration", "agent-bridge", "schema-mapping"]` |
| `05-mcp-in-agent-loop` | `["mcp-agent", "agent-loop", "remote-tools", "transport-agnostic", "capstone"]` |

### `estimated_minutes` per exercise

| Exercise | Minutes |
|---|---|
| `01-mcp-server-basics` | 25 |
| `02-mcp-client-connect` | 25 |
| `03-resources-and-prompts` | 30 |
| `04-tools-with-mcp` | 40 |
| `05-mcp-in-agent-loop` | 45 |

### `model_cost_hint` per exercise

| Exercise | Hint |
|---|---|
| `01-mcp-server-basics` | `"$0 (no API calls — pure MCP)"` |
| `02-mcp-client-connect` | `"$0 (no API calls — pure MCP)"` |
| `03-resources-and-prompts` | `"$0 (no API calls — pure MCP)"` |
| `04-tools-with-mcp` | `"~$0.005 (Haiku 4.5, 1–3 tool bridge iterations)"` |
| `05-mcp-in-agent-loop` | `"~$0.008 (Haiku 4.5, multi-step agent loop)"` |

---

## Exercise.md structure

All `exercise.md` files (both `es/` and `en/`) follow the 6-section contract from `docs/EXERCISE-CONTRACT.md`:

1. **`# Exercise <NN> — <title>`** — H1 matching `meta.json.title`
2. **`## Concepto`** / **`## Concept`** — 2–4 paragraphs. No code.
3. **`## Docs & referencias`** / **`## Docs & references`** — numbered, canonical URLs.
4. **`## Tu tarea`** / **`## Your task`** — step-by-step guide for `starter.ts`.
5. **`## Cómo verificar`** / **`## How to verify`** — `aidev verify <id>` + bullet list.
6. **`## Concepto extra (opcional)`** / **`## Extra concept (optional)`** — optional deepening.

### Canonical doc URLs for this track

- MCP server quickstart: `https://modelcontextprotocol.io/quickstart/server`
- MCP client quickstart: `https://modelcontextprotocol.io/quickstart/client`
- MCP architecture: `https://modelcontextprotocol.io/docs/concepts/architecture`
- Claude Messages API: `https://docs.claude.com/en/api/messages`

### `## Concepto` content requirements per exercise

**`01-mcp-server-basics`**:
- Explain MCP anatomy: Server declares capabilities (tools, resources, prompts). Client discovers and invokes. JSON-RPC over transport.
- Explain why `console.log` is fatal in stdio servers: stdout IS the JSON-RPC channel. Any non-JSON output breaks the protocol silently. `console.error` writes to stderr — safe.
- Introduce `McpServer` as the high-level abstraction (vs raw `Server`). Explain `.tool()` registration pattern.
- Explain InMemoryTransport as the test primitive — two linked pipes, no subprocess, fully synchronous teardown.

**`02-mcp-client-connect`**:
- Explain client-side lifecycle: construct `Client` → pair transport → `connect()` → `listTools()` → `callTool()` → `close()`.
- Explain capabilities negotiation: the handshake that establishes which protocol features are available.
- Contrast `InMemoryTransport` (tests) vs `StdioClientTransport` (production): same `Client` API, different transport. The client code doesn't change.
- Note `command: "bun"` for `StdioClientTransport` — NOT `node` (Bun-native project).

**`03-resources-and-prompts`**:
- Explain the three MCP primitives and when to use each:
  | Primitive | Use when | Example |
  |---|---|---|
  | Tools | Claude needs to call a function | `search_docs`, `read_chunk` |
  | Resources | Claude needs to read structured data | documentation, files, DB rows |
  | Prompt templates | Standardize how Claude is invoked | reusable user-message templates |
- Explain resource URI templates (`docs://chunks/{id}`) vs static resources (`docs://index`).
- Explain that prompts are server-side templates — the client calls `getPrompt({ name, arguments })` to get fully rendered messages.

**`04-tools-with-mcp`**:
- Bridge walkthrough: MCP `tool.inputSchema` (JSON Schema object) → Anthropic `tool.input_schema` (same shape, different key). This is the entire translation.
- Show the mapping table side-by-side:
  | MCP field | Claude field |
  |---|---|
  | `tool.name` | `tool.name` |
  | `tool.description` | `tool.description` |
  | `tool.inputSchema` | `tool.input_schema` |
- Explain the loop: Claude emits `tool_use` → route `name`+`input` to `mcpClient.callTool()` → append `tool_result` → continue. The bridge pattern is symmetric with 05-agents.

**`05-mcp-in-agent-loop`**:
- Show the direct substitution: `executeTool(name, input)` from 05-agents is replaced by `await mcpClient.callTool({ name, arguments: input })`. The loop structure is identical.
- Explain what this enables: the agent can now talk to any MCP server — local, remote, or external — without code changes. The tool surface is dynamic.
- Mention Claude Desktop + Claude Code: both use MCP to expose tools to Claude. The agent loop you just wrote IS how Claude Desktop works internally.

### `## Concepto extra` content per exercise

- **`01`**: Mention `StdioServerTransport` as the production equivalent — same `server.connect(transport)` call, but transport is stdin/stdout. Show 3-line diff from InMemory to stdio.
- **`02`**: Mention HTTP/SSE transport (`StreamableHttpClientTransport`) as the remote-server pattern. Same `Client` API — only transport changes.
- **`03`**: Mention that resource subscriptions (`client.subscribeResource()`) allow real-time updates. Server pushes changes; client receives notifications. Out of scope for v1 but a key production pattern.
- **`04`**: Mention the Anthropic SDK's upcoming MCP integration helper (may land post-spec date). Manual bridging is the correct learning path — understand the protocol before using a helper.
- **`05`**: Mention Claude Desktop and Claude Code as production consumers of MCP servers. The `createResearchServer()` pattern, deployed via stdio, is directly usable in `claude_desktop_config.json` or as a Claude Code MCP extension.

---

## Out of scope (delta)

Explicitly excluded from this change:

- HTTP/SSE transport (`StreamableHttpClientTransport`) — stdio only in v1.
- MCP authentication / OAuth.
- Subprocess lifecycle management / `StdioClientTransport` in tests.
- Custom server-initiated notifications / subscriptions.
- Anthropic SDK MCP helper — manual bridge is the pedagogical path.
- Claude Desktop or Claude Code setup steps (mentioned in Concepto extra only).
- Multi-server orchestration.
- Any changes to `code/packages/runner/src/harness.ts`.
- Any changes to `code/packages/cli/src/`.
- Any changes to `cost.ts`.
- New environment variables (only `ANTHROPIC_API_KEY`, already exists).
- Track-level README.
- Multi-provider support.
- Streaming in any exercise.
- `zod@^4.x` — spec pins `^3.25.0` until SDK peer dep clarified.
