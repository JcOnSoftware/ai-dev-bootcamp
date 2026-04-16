# Tasks: add-mcp-track

Change: `add-mcp-track`
Phase: tasks
Total: 73 tasks across 8 batches (Batch 0 + Batch 0.5 + Batches 1–5 + Batch 6)
Strict TDD: ENABLED — tests-first always, solution only written after FAIL confirmed.

---

## Batch 0 — Dependency install (3 tasks)

- [ ] B0-T01: Add `"dependencies": { "@modelcontextprotocol/sdk": "^1.29.0", "zod": "^3.25.0" }` block to `code/package.json` (root currently has only devDeps — new top-level `"dependencies"` key required).
- [ ] B0-T02: From `code/`: `bun install` → verify `bun.lock` updates cleanly; review lockfile diff for unexpected transitive bumps before committing.
- [ ] B0-T03: Commit: `chore(deps): add @modelcontextprotocol/sdk + zod for 06-mcp track`.

---

## Batch 0.5 — Shared fixture (4 tasks)

- [ ] B0.5-T01: Create dir `code/packages/exercises/06-mcp/fixtures/`.
- [ ] B0.5-T02: Write `code/packages/exercises/06-mcp/fixtures/research-server.ts` — prominent `// WARNING: NEVER use console.log in MCP server files — it corrupts the stdio JSON-RPC stream. Use console.error only.` comment at top of file; exports `createResearchServer(): McpServer`; server name "research-server", version "1.0.0"; registers `search_docs` via `server.registerTool("search_docs", { title: "Search docs", description: "...", inputSchema: { query: z.string(), top_k: z.number().optional() } }, async (args) => ({ content: [{ type: "text", text: executeSearchDocs(args) }] }))` and `read_chunk` similarly; imports `executeSearchDocs`, `executeReadChunk` from `../../05-agents/fixtures/research-tools.ts`; import `z` from `"zod"`; import `{ McpServer }` from `"@modelcontextprotocol/sdk/server/mcp.js"`.
- [ ] B0.5-T03: From `code/`: `bunx tsc --noEmit` → zero errors.
- [ ] B0.5-T04: Commit: `feat(exercises/06-mcp): add shared research-server fixture`.

---

## Batch 1 — 01-mcp-server-basics (11 tasks)

- [ ] B1-T01: Create dirs `code/packages/exercises/06-mcp/01-mcp-server-basics/`, `es/`, `en/`.
- [ ] B1-T02: Write `tests.test.ts` — NO API key guard (pure MCP); imports `{ InMemoryTransport }` from `"@modelcontextprotocol/sdk/inMemory.js"` and `{ Client }` from `"@modelcontextprotocol/sdk/client/index.js"`; uses `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET`; test "server exposes echo tool": `listTools()` result has length 1; `tools[0].name === "echo"`; test "callTool returns input text": `callTool({ name: "echo", arguments: { text: "hello" } })` → `content[0].type === "text"` and `content[0].text === "hello"`; test "server name is echo-server": check via server info or capability; `afterAll`: `await client.close()` mandatory.
- [ ] B1-T03: Write `starter.ts` — `// Docs:` header with `https://modelcontextprotocol.io/quickstart/server` and `https://modelcontextprotocol.io/docs/concepts/architecture`; `// WARNING: NEVER use console.log in MCP server files — it corrupts the stdio JSON-RPC stream. Use console.error only.` comment; import `{ McpServer }` from `"@modelcontextprotocol/sdk/server/mcp.js"`; import `z` from `"zod"`; export `function buildEchoServer(): McpServer` → throws `new Error("TODO: implementa buildEchoServer()")`; export `default async function run()` → throws `new Error("TODO: implementa run()")`.
- [ ] B1-T04: `AIDEV_TARGET=starter bun test packages/exercises/06-mcp/01-mcp-server-basics` from `code/` → MUST fail.
- [ ] B1-T05: Write `solution.ts` — `buildEchoServer()`: creates `new McpServer({ name: "echo-server", version: "1.0.0" })`, registers `echo` tool via `server.tool("echo", { text: z.string() }, async ({ text }) => ({ content: [{ type: "text", text }] }))`; `run()`: creates `InMemoryTransport.createLinkedPair()`, connects server + client, calls `listTools()` then `callTool`, returns content. Includes `// WARNING: NEVER use console.log` comment at top.
- [ ] B1-T06: `AIDEV_TARGET=solution bun test packages/exercises/06-mcp/01-mcp-server-basics` from `code/` → MUST pass.
- [ ] B1-T07: Write `es/exercise.md` — 6 sections: `# Ejercicio 01 — MCP Server Basics`; `## Concepto` (MCP = protocol, not library — JSON-RPC 2.0 over stdio/SSE/InMemory; server exposes tools/resources/prompts; client calls them; NEVER `console.log` in server — corrupts JSON-RPC stream); `## Docs y referencias`; `## Tu tarea`; `## Cómo verificar` (`aidev verify 01-mcp-server-basics`); `## Qué validan los tests` (listTools length 1, tool name "echo", callTool returns input text, server name "echo-server"); `## Concepto extra` (Claude Desktop integration via `claude_desktop_config.json` snippet).
- [ ] B1-T08: Write `en/exercise.md` — 6 equivalent sections in English.
- [ ] B1-T09: Write `meta.json` — `{"id":"01-mcp-server-basics","track":"06-mcp","title":"MCP Server Basics","version":"1.0.0","valid_until":"2026-10-15","concepts":["mcp-protocol","mcp-server","tool-registration","json-rpc","inmemory-transport"],"estimated_minutes":20,"requires":["01-first-call"],"locales":["es","en"],"model_cost_hint":"$0 (no API calls)"}`.
- [ ] B1-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm `01-mcp-server-basics` appears under `06-mcp`.
- [ ] B1-T11: Commit: `feat(exercises/06-mcp/01-mcp-server-basics): add MCP server basics exercise`.

---

## Batch 2 — 02-mcp-client-connect (11 tasks)

- [ ] B2-T01: Create dirs `code/packages/exercises/06-mcp/02-mcp-client-connect/`, `es/`, `en/`.
- [ ] B2-T02: Write `tests.test.ts` — NO API key guard; `InMemoryTransport.createLinkedPair()` + `createResearchServer()`; uses harness + `resolveExerciseFile` + `AIDEV_TARGET`; test "lists 2 tools": `result.userReturn.tools.length === 2`; test "tool names match": `new Set(result.userReturn.tools.map(t => t.name))` deepEquals `new Set(["search_docs", "read_chunk"])`; test "searchResult content is text": `result.userReturn.searchResult.content[0].type === "text"`; `afterAll`: `await client.close()`.
- [ ] B2-T03: Write `starter.ts` — `// Docs:` header with `https://modelcontextprotocol.io/quickstart/client` and `https://modelcontextprotocol.io/docs/concepts/architecture`; imports `createResearchServer` from `"../fixtures/research-server.ts"`; import `{ Client }` from `"@modelcontextprotocol/sdk/client/index.js"`; import `{ InMemoryTransport }` from `"@modelcontextprotocol/sdk/inMemory.js"`; export `async function connectResearchClient(): Promise<{ client: Client; cleanup: () => Promise<void> }>` → throws TODO; export `default async function run()` → throws TODO.
- [ ] B2-T04: `AIDEV_TARGET=starter bun test packages/exercises/06-mcp/02-mcp-client-connect` from `code/` → MUST fail.
- [ ] B2-T05: Write `solution.ts` — `connectResearchClient()`: `InMemoryTransport.createLinkedPair()`, `createResearchServer()`, `server.connect(serverT)`, new `Client({ name: "research-client", version: "1.0.0" })`, `client.connect(clientT)`, returns `{ client, cleanup: async () => { await client.close(); } }`; `run()`: calls `connectResearchClient()`, `client.listTools()`, `client.callTool({ name: "search_docs", arguments: { query: "caching" } })`, `cleanup()`, returns `{ tools, searchResult }`.
- [ ] B2-T06: `AIDEV_TARGET=solution bun test packages/exercises/06-mcp/02-mcp-client-connect` from `code/` → MUST pass.
- [ ] B2-T07: Write `es/exercise.md` — 6 sections: `# Ejercicio 02 — MCP Client Connect`; `## Concepto` (MCP client is protocol peer — NOT HTTP client; `listTools()` = discovery, `callTool()` = invocation; cleanup pattern mandatory — leaking transports causes test suite hangs; InMemory vs Stdio: same client code, different transport layer); `## Docs y referencias`; `## Tu tarea`; `## Cómo verificar`; `## Qué validan los tests`; `## Concepto extra` (`StdioClientTransport` snippet for subprocess servers).
- [ ] B2-T08: Write `en/exercise.md` — 6 equivalent sections in English.
- [ ] B2-T09: Write `meta.json` — `{"id":"02-mcp-client-connect","track":"06-mcp","title":"MCP Client Connect","version":"1.0.0","valid_until":"2026-10-15","concepts":["mcp-client","tool-discovery","inmemory-transport","cleanup-pattern","stdio-transport"],"estimated_minutes":20,"requires":["01-mcp-server-basics"],"locales":["es","en"],"model_cost_hint":"$0 (no API calls)"}`.
- [ ] B2-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm `02-mcp-client-connect` appears under `06-mcp`.
- [ ] B2-T11: Commit: `feat(exercises/06-mcp/02-mcp-client-connect): add MCP client connect exercise`.

---

## Batch 3 — 03-resources-and-prompts (11 tasks)

- [ ] B3-T01: Create dirs `code/packages/exercises/06-mcp/03-resources-and-prompts/`, `es/`, `en/`.
- [ ] B3-T02: Write `tests.test.ts` — NO API key guard; `InMemoryTransport` pair + `buildDocsResourceServer()`; uses harness + `resolveExerciseFile` + `AIDEV_TARGET`; test "resource list includes docs://index": `listResources()` includes entry with `uri === "docs://index"`; test "prompt list includes summarize_docs": `listPrompts()` includes entry with `name === "summarize_docs"`; test "getPrompt with topic returns caching": `getPrompt({ name: "summarize_docs", arguments: { topic: "caching" } })` → messages[0].content contains `"caching"`; `afterAll`: `await client.close()`.
- [ ] B3-T03: Write `starter.ts` — `// Docs:` header with `https://modelcontextprotocol.io/docs/concepts/resources` and `https://modelcontextprotocol.io/docs/concepts/prompts`; `// WARNING: NEVER use console.log in MCP server files — it corrupts the stdio JSON-RPC stream. Use console.error only.` comment; import `{ McpServer }` from `"@modelcontextprotocol/sdk/server/mcp.js"`; import `z` from `"zod"`; export `function buildDocsResourceServer(): McpServer` → throws TODO; export `default async function run()` → throws TODO.
- [ ] B3-T04: `AIDEV_TARGET=starter bun test packages/exercises/06-mcp/03-resources-and-prompts` from `code/` → MUST fail.
- [ ] B3-T05: Write `solution.ts` — `buildDocsResourceServer()`: `new McpServer({ name: "docs-server", version: "1.0.0" })`; register resource `docs://index`; register resource template `docs://chunks/{id}`; register prompt `summarize_docs` with `topic: z.string()` param returning message containing topic string; `run()`: connect pair, `listResources()`, `readResource("docs://index")`, `listPrompts()`, `getPrompt({ name: "summarize_docs", arguments: { topic: "caching" } })`, cleanup, return. Includes `// WARNING: NEVER use console.log` comment at top.
- [ ] B3-T06: `AIDEV_TARGET=solution bun test packages/exercises/06-mcp/03-resources-and-prompts` from `code/` → MUST pass.
- [ ] B3-T07: Write `es/exercise.md` — 6 sections: `# Ejercicio 03 — Resources y Prompts`; `## Concepto` (3 MCP primitives: Tools=acciones, Resources=datos, Prompts=templates reutilizables; resources usan URI scheme, templates usan `{param}`; prompts son mensajes pre-construidos inyectables en el contexto); `## Docs y referencias`; `## Tu tarea`; `## Cómo verificar`; `## Qué validan los tests`; `## Concepto extra` (Sampling — server-initiated LLM calls via `server.createMessage()` — el tercer vector MCP).
- [ ] B3-T08: Write `en/exercise.md` — 6 equivalent sections in English.
- [ ] B3-T09: Write `meta.json` — `{"id":"03-resources-and-prompts","track":"06-mcp","title":"Resources and Prompts","version":"1.0.0","valid_until":"2026-10-15","concepts":["mcp-resources","mcp-prompts","uri-templates","mcp-primitives"],"estimated_minutes":25,"requires":["02-mcp-client-connect"],"locales":["es","en"],"model_cost_hint":"$0 (no API calls)"}`.
- [ ] B3-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm `03-resources-and-prompts` appears under `06-mcp`.
- [ ] B3-T11: Commit: `feat(exercises/06-mcp/03-resources-and-prompts): add resources and prompts exercise`.

---

## Batch 4 — 04-tools-with-mcp (11 tasks)

- [ ] B4-T01: Create dirs `code/packages/exercises/06-mcp/04-tools-with-mcp/`, `es/`, `en/`.
- [ ] B4-T02: Write `tests.test.ts` — two describes: unit `describe("unit — mcpToolsToAnthropicFormat", ...)` (NO API key): test "preserves names and descriptions" → `result[0].name === "search_docs"`; test "renames inputSchema to input_schema" → `result[0].input_schema` exists, `result[0].inputSchema === undefined`; integration `describe` with `beforeAll` guard `ANTHROPIC_API_KEY`: `InMemoryTransport` + `createResearchServer()` for MCP side; harness + `resolveExerciseFile` + `AIDEV_TARGET`; test "makes at least 1 tool call": `result.userReturn.toolCalls.length >= 1`; test "answer has content": `result.userReturn.answer.length > 30`; test "model matches haiku": `result.calls[0].request.model` matches `/haiku/i`; `afterAll`: close client. Timeout 30000 on integration tests.
- [ ] B4-T03: Write `starter.ts` — `// Docs:` header with `https://modelcontextprotocol.io/quickstart/client`, `https://docs.claude.com/en/api/messages`, and `https://modelcontextprotocol.io/docs/concepts/architecture`; import `Anthropic` from `"@anthropic-ai/sdk"`; import `{ Tool }` from `"@modelcontextprotocol/sdk/types.js"`; export `function mcpToolsToAnthropicFormat(mcpTools: Tool[]): Anthropic.Tool[]` → throws TODO; export `async function askClaudeWithMcpTools(question: string): Promise<{ answer: string; toolCalls: { name: string; input: unknown }[] }>` → throws TODO; export `default async function run()` → throws TODO.
- [ ] B4-T04: `AIDEV_TARGET=starter bun test packages/exercises/06-mcp/04-tools-with-mcp` from `code/` → MUST fail.
- [ ] B4-T05: Write `solution.ts` — model `claude-haiku-4-5-20251001` verbatim; `mcpToolsToAnthropicFormat`: maps each `Tool` to `{ name, description, input_schema: tool.inputSchema }` (pure); `askClaudeWithMcpTools`: `InMemoryTransport` + `createResearchServer()` + `Client`; `client.listTools()` → convert → DIY bridge loop; collect `toolCalls`; cleanup → return `{ answer, toolCalls }`; `run()` query: "What's the TTL default for prompt caching?".
- [ ] B4-T06: `AIDEV_TARGET=solution bun test packages/exercises/06-mcp/04-tools-with-mcp` from `code/` → MUST pass.
- [ ] B4-T07: Write `es/exercise.md` — 6 sections: `# Ejercicio 04 — Tools with MCP`; `## Concepto` (manual bridge: MCP usa `inputSchema` camelCase, Anthropic usa `input_schema` snake_case — el bridge es el mapeo; explicar POR QUÉ manual: entender la costura antes de usar helpers; mostrar el loop 3-pasos: list → convert → call); `## Docs y referencias`; `## Tu tarea`; `## Cómo verificar`; `## Qué validan los tests`; `## Concepto extra` (`client.beta.messages.toolRunner()` — abstrae el loop; usar en producción, aprender manual primero).
- [ ] B4-T08: Write `en/exercise.md` — 6 equivalent sections in English.
- [ ] B4-T09: Write `meta.json` — `{"id":"04-tools-with-mcp","track":"06-mcp","title":"Tools with MCP","version":"1.0.0","valid_until":"2026-10-15","concepts":["mcp-claude-bridge","tool-format-conversion","tool-use-loop","input-schema"],"estimated_minutes":30,"requires":["03-resources-and-prompts"],"locales":["es","en"],"model_cost_hint":"~$0.005 (Haiku 4.5, 1-2 tool calls)"}`.
- [ ] B4-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm `04-tools-with-mcp` appears under `06-mcp`.
- [ ] B4-T11: Commit: `feat(exercises/06-mcp/04-tools-with-mcp): add tools with MCP exercise`.

---

## Batch 5 — 05-mcp-in-agent-loop (11 tasks)

- [ ] B5-T01: Create dirs `code/packages/exercises/06-mcp/05-mcp-in-agent-loop/`, `es/`, `en/`.
- [ ] B5-T02: Write `tests.test.ts` — integration `describe` with `beforeAll` guard `ANTHROPIC_API_KEY`; `InMemoryTransport` + `createResearchServer()` for MCP; harness + `resolveExerciseFile` + `AIDEV_TARGET`; test "iterations in bounds": `result.userReturn.iterations >= 1 && <= 10`; test "at least 1 tool call": `result.userReturn.toolCalls.length >= 1`; test "final answer contains cost multipliers": final message text contains `"1.25"` or `"2"` or `"25%"` or `"100%"`; test "calls.length equals iterations": `result.calls.length === result.userReturn.iterations`; `afterAll`: close client. Timeout 30000.
- [ ] B5-T03: Write `starter.ts` — `// Docs:` header with `https://modelcontextprotocol.io/quickstart/client`, `https://docs.claude.com/en/api/messages`, `https://modelcontextprotocol.io/docs/concepts/architecture`; import `Anthropic` from `"@anthropic-ai/sdk"`; import `{ Client }` from `"@modelcontextprotocol/sdk/client/index.js"`; export `async function runAgentWithMcpTools(question: string, maxIterations?: number): Promise<{ finalMessage: string; iterations: number; toolCalls: { name: string; input: unknown }[] }>` → throws TODO; export `default async function run()` → throws TODO.
- [ ] B5-T04: `AIDEV_TARGET=starter bun test packages/exercises/06-mcp/05-mcp-in-agent-loop` from `code/` → MUST fail.
- [ ] B5-T05: Write `solution.ts` — model `claude-haiku-4-5-20251001` verbatim; `runAgentWithMcpTools`: `InMemoryTransport` + `createResearchServer()` + `Client`; MCP-backed executeTool: `async (name, input) => (await client.callTool({ name, arguments: input as Record<string, unknown> })).content[0].text`; full DIY agent loop collecting `toolCalls` and `iterations`; `end_turn` → extract `finalMessage` text → cleanup → return; `run()` query: "Compare the cost multipliers for 5-minute vs 1-hour caching".
- [ ] B5-T06: `AIDEV_TARGET=solution bun test packages/exercises/06-mcp/05-mcp-in-agent-loop` from `code/` → MUST pass.
- [ ] B5-T07: Write `es/exercise.md` — 6 sections: `# Ejercicio 05 — MCP in Agent Loop`; `## Concepto` (full circle: loop de 05-agents + MCP como backend de tools; `executeTool` se convierte en `client.callTool()`; el modelo nunca sabe si las tools son locales o remotas — MCP es la abstracción; este es el patrón de producción para asistentes con tool servers externos); `## Docs y referencias`; `## Tu tarea`; `## Cómo verificar`; `## Qué validan los tests`; `## Concepto extra` (multi-server agents: conectar múltiples MCP servers simultáneamente, mergear tool lists).
- [ ] B5-T08: Write `en/exercise.md` — 6 equivalent sections in English.
- [ ] B5-T09: Write `meta.json` — `{"id":"05-mcp-in-agent-loop","track":"06-mcp","title":"MCP in Agent Loop","version":"1.0.0","valid_until":"2026-10-15","concepts":["mcp-agent","full-loop","tool-abstraction","production-pattern"],"estimated_minutes":35,"requires":["04-tools-with-mcp"],"locales":["es","en"],"model_cost_hint":"~$0.008 (Haiku 4.5, multi-iteration)"}`.
- [ ] B5-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm `05-mcp-in-agent-loop` appears under `06-mcp`.
- [ ] B5-T11: Commit: `feat(exercises/06-mcp/05-mcp-in-agent-loop): add MCP in agent loop exercise`.

---

## Batch 6 — Final validation (5 tasks)

- [ ] B6-T01: `bunx tsc --noEmit` from `code/` → zero TypeScript errors.
- [ ] B6-T02: `bun test packages/cli packages/runner` from `code/` → non-integration suite GREEN (expect ~104 pass, 0 fail).
- [ ] B6-T03: `AIDEV_TARGET=solution bun test packages/exercises/06-mcp/` from `code/` → all 5 suites GREEN (01-03 pure MCP no API key; 04-05 hybrid require `ANTHROPIC_API_KEY`).
- [ ] B6-T04: `bun packages/cli/src/index.ts list` from `code/` → visually confirm 5 exercises under `06-mcp` in correct order; check both `--locale es` and `--locale en`.
- [ ] B6-T05: `git log --oneline -10` → confirm 7 commits (deps + fixture + 5 exercises), conventional format, no `Co-Authored-By` lines.

---

## Key invariants (enforced across all batches)

- `console.log` corruption warning comment in EVERY server-side `.ts` file (fixture + 01 + 03 starters/solutions).
- `valid_until: "2026-10-15"` EXACT in all `meta.json` files — do NOT drift to `2026-12-31`.
- Model `claude-haiku-4-5-20251001` verbatim in 04 and 05 solutions.
- All MCP clients closed in `afterAll` — non-optional (leaking transports causes test suite hangs).
- Canonical URLs: `modelcontextprotocol.io/quickstart/...`, `modelcontextprotocol.io/docs/concepts/...`, `docs.claude.com/en/api/messages`.
- SDK subpath imports with `.js` extension: `/server/mcp.js`, `/client/index.js`, `/inMemory.js`, `/types.js`.
- Chunk `metadata.source` values are `"prompt-caching-docs"` / `"tool-use-docs"` — NOT `"prompt-caching"`.
- No subprocess tests anywhere — all tests use `InMemoryTransport.createLinkedPair()`.
