# Design: add-mcp-track

**Change**: add-mcp-track (track 06-mcp — final, closes 6-track bootcamp)
**Phase**: design
**Date**: 2026-04-14
**Artifact store**: hybrid (engram + openspec)

## Architecture overview

No new runtime modules. This change is **content + one new dependency**. All five
exercises live entirely under `code/packages/exercises/06-mcp/` and reuse the
existing harness (`@aidev/runner`) and exercise contract. Integration surface:

- New dep at workspace root: `@modelcontextprotocol/sdk@^1.29.0` + `zod@^3.25.0`.
- New shared fixture: `fixtures/research-server.ts` that wraps the already-tested
  `executeSearchDocs`/`executeReadChunk` from the `05-agents` fixture.
- `solution.ts` files use **stdio** transport (the real-world pattern: Claude
  Desktop, Claude Code, MCP Inspector all speak stdio JSON-RPC to servers).
- `tests.test.ts` files use **InMemoryTransport** for determinism — no subprocess
  lifecycle, no zombie processes, no port collisions.

### Diagram 1 — MCP architecture (exercises 01–02)

```
┌─────────────────┐  JSON-RPC 2.0   ┌─────────────────┐
│    MCP Client   │◄───────────────►│    MCP Server   │
│  (your code)    │    stdio        │  (your code)    │
│                 │  or InMemory    │   + handlers    │
└─────────────────┘                 └─────────────────┘
       │                                     │
       │ listTools, callTool,                │ executeSearchDocs,
       │ listResources, readResource,        │ executeReadChunk,
       │ listPrompts, getPrompt              │ resources, prompts
```

### Diagram 2 — Claude ↔ MCP bridge (exercise 04)

```
user query → Anthropic.messages.create (with MCP tools translated)
                  ↓
          response.stop_reason === "tool_use" ?
                  │
                  ↓
          Claude tool_use block (name, input)
                  ↓
          mcpClient.callTool({ name, arguments: input })
                  ↓
          tool_result content back to Claude
                  ↓
          iterate until end_turn
```

### Diagram 3 — Full agent loop with MCP (exercise 05)

```
agent loop (from 05-agents) with executeTool replaced by:
    async (name, input) => {
      const result = await mcpClient.callTool({ name, arguments: input });
      return result.content[0].text;  // tool_result for Claude
    }
```

## ADRs

### ADR-1: Use official `@modelcontextprotocol/sdk`, not DIY JSON-RPC

**Decision**: Build on the official SDK (`@modelcontextprotocol/sdk@^1.29.0`).

**Rationale**: The SDK is the canonical client/server pattern learners will
encounter in production (Claude Desktop configs, MCP Inspector, every public MCP
server). Teaching DIY JSON-RPC would be a distraction — transport framing,
schema validation, message correlation are already solved. The bootcamp teaches
MCP, not networking.

**Trade-off**: One more dep at the workspace root. Worth it; matches real-world
usage.

### ADR-2: stdio transport in solutions, InMemoryTransport in tests

**Decision**: `solution.ts` connects via `StdioClientTransport({ command: "bun", args: [...] })`.
`tests.test.ts` uses `InMemoryTransport.createLinkedPair()`.

**Rationale**:
- **stdio in solutions** = real-world pattern; Claude Desktop launches servers
  this way via `claude_desktop_config.json`.
- **InMemory in tests** = deterministic, no subprocess cleanup, no zombie risk,
  no PATH/bin resolution issues in CI.

**Trade-off**: Learners see two transports. We frame this explicitly: "stdio is
what you'll deploy; InMemory is what you'll test."

### ADR-3: Manual Claude↔MCP bridge in exercise 04 (vs SDK helper)

**Decision**: Exercise 04 hand-writes the translation from MCP tool definitions
to Anthropic's `tools` parameter, and from Claude's `tool_use` block to
`mcpClient.callTool()`.

**Rationale**: No first-party Anthropic SDK helper exists for MCP. Even if one
landed later, the 5-line translation is **pedagogically central** — it's where
the two protocols meet. Hiding it defeats the exercise.

### ADR-4: `research-server.ts` fixture delegates to `05-agents/fixtures/research-tools.ts`

**Decision**: The new MCP fixture imports `executeSearchDocs`/`executeReadChunk`
from the agents track and wraps them as MCP tool handlers.

**Rationale**: Continues the cross-track reuse convention (04-rag → 05-agents
already does this). The pure functions are already unit-tested. The MCP layer
adds schema + transport, not logic.

### ADR-5: Zod for MCP tool input schemas

**Decision**: `McpServer.registerTool()` receives a Zod schema shape
(`{ query: z.string(), top_k: z.number().optional() }`). The SDK auto-derives
the JSON Schema exposed over the wire.

**Rationale**: Simpler, less error-prone than hand-authoring JSON Schema.
Idiomatic for modern TS + the SDK's documented pattern.

**Trade-off**: New dep. Pinned at workspace root to prevent drift.

### ADR-6: Place deps at workspace root `code/package.json`, not per-exercise

**Decision**: `@modelcontextprotocol/sdk` and `zod` go in `code/package.json`
`dependencies` (a new section — root currently only has `devDependencies`).

**Rationale**: Bun workspaces hoist; a single source of truth prevents version
drift between exercise packages. Matches how `@anthropic-ai/sdk` is already
consumed.

### ADR-7: `console.error` for diagnostics, NEVER `console.log`

**Decision**: Every MCP server file (`research-server.ts`, `solution.ts` in
exercises 01 and 03) carries a prominent comment:

```ts
// CRITICAL: Do NOT use console.log in this file — it corrupts stdio JSON-RPC.
// Use console.error for diagnostics.
```

**Rationale**: `stdout` is the JSON-RPC channel. `console.log` writes malformed
frames and the client fails with cryptic parse errors. This is the #1 footgun
for MCP server authors.

### ADR-8: `command: "bun"` in `StdioClientTransport`

**Decision**: Solutions spawn servers with `command: "bun"`, not `"node"`.

**Rationale**: This project is Bun-native. The exercise concept section
mentions that a Node project would use `"node"` — this is the only
runtime-specific detail and it's worth flagging.

### ADR-9: `.js` subpath imports from the SDK

**Decision**: Use `@modelcontextprotocol/sdk/server/mcp.js`,
`@modelcontextprotocol/sdk/client/stdio.js`, `@modelcontextprotocol/sdk/inMemory.js`,
etc. (with `.js` even though source is TS).

**Rationale**: Required by the SDK's `package.json` exports map. Standard NodeNext
ESM convention; Bun honors it.

### ADR-10: No HTTP transport, no auth, no OAuth in v1

**Decision**: Track 06 covers stdio + InMemory only. HTTP, SSE, OAuth are out.

**Rationale**: Stated in proposal scope-out. stdio is the dominant deployment
pattern for local servers. HTTP/auth is a separate concern worth its own future
track when the SDK's HTTP story stabilizes.

## Module API contracts

### Shared fixture — `code/packages/exercises/06-mcp/fixtures/research-server.ts`

```ts
// CRITICAL: Do NOT use console.log in this file — it corrupts stdio JSON-RPC.
// Use console.error for diagnostics.
//
// Docs:
//   MCP servers (TS):  https://modelcontextprotocol.io/docs/develop/build-server
//   Server SDK:        https://modelcontextprotocol.io/docs/sdk (typescript)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  executeSearchDocs,
  executeReadChunk,
} from "../../05-agents/fixtures/research-tools.ts";

export function createResearchServer(): McpServer {
  const server = new McpServer({
    name: "research-server",
    version: "1.0.0",
  });

  server.registerTool(
    "search_docs",
    {
      title: "Search docs",
      description:
        "Search the Anthropic docs corpus for chunks matching a keyword query. Returns top-K chunk ids + topic metadata.",
      inputSchema: {
        query: z.string(),
        top_k: z.number().optional(),
      },
    },
    async ({ query, top_k }) => ({
      content: [{ type: "text", text: executeSearchDocs({ query, top_k }) }],
    }),
  );

  server.registerTool(
    "read_chunk",
    {
      title: "Read chunk",
      description:
        "Read the full content of a specific docs chunk by id.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => ({
      content: [{ type: "text", text: executeReadChunk({ id }) }],
    }),
  );

  return server;
}
```

### Test harness pattern — reused across exercises 02–05

```ts
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createResearchServer } from "../fixtures/research-server.ts";

async function spawnTestClient() {
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const server = createResearchServer();
  await server.connect(serverTransport);

  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);

  return {
    client,
    cleanup: async () => {
      await client.close();
      await server.close();
    },
  };
}
```

Per-exercise public exports are defined in the spec and should be copied
verbatim during apply.

## Package.json changes

`code/package.json` — add a new `dependencies` section (the root currently has
only `devDependencies`):

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "zod": "^3.25.0"
  }
}
```

After editing, run `bun install` from `code/`. Commit both `package.json` and
the updated `bun.lock`.

## File layout

```
code/packages/exercises/06-mcp/
├── fixtures/
│   └── research-server.ts
├── 01-mcp-server-basics/
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   ├── meta.json
│   ├── es/exercise.md
│   └── en/exercise.md
├── 02-mcp-client-connect/
│   └── (same 6-file layout)
├── 03-resources-and-prompts/
│   └── (same)
├── 04-tools-with-mcp/
│   └── (same)
└── 05-mcp-in-agent-loop/
    └── (same)
```

## Testing strategy

- **Unit**: exercise 04's `mcpToolsToAnthropicFormat` is a pure function — test
  it without API key and without MCP transport. Fast signal on the translation
  logic that ADR-3 says is pedagogically central.
- **Integration via InMemory**: every exercise (01–05) spins up a
  `createLinkedPair()` in its `tests.test.ts`. 01–03 need no `ANTHROPIC_API_KEY`.
  04–05 hit the real API; guard with the standard `beforeAll` skip pattern.
- **Cleanup**: every test that spawns a pair closes both `client` and `server`
  in `afterAll`. No subprocess tests → no zombie risk.
- **Structural assertions only** (per project standards): assert on tool names
  returned by `listTools`, resource URIs, shape of `callTool` results — not on
  LLM-generated text.
- **No subprocess tests** in the suite. stdio is exercised only in `solution.ts`
  when a learner runs it manually via `aidev run`.

## Risk register

1. **SDK 1.x pre-2.0 breaking changes**. `@modelcontextprotocol/sdk` is on the
   1.x line and still evolving. Mitigation: set `valid_until: 2026-10-15` in
   meta.json (6 months); weekly health-check catches SDK drift early.
2. **`console.log` footgun** silently corrupts stdio. Mitigation: invariant
   comment at the top of every server file (ADR-7). When violated, tests fail
   with JSON parse errors that point to the cause.
3. **Dep installation friction**: pulling the branch and not running
   `bun install` will break every 06-mcp test. Mitigation: note in CONTRIBUTING
   and README; the first test will fail with a clear module-not-found error.
4. **Bun + SDK subpath exports** edge cases. Validated in explore phase. If an
   incompat surfaces mid-apply, escalate to orchestrator and consider pinning
   to a known-good minor.
5. **Zod version drift**. Pin `^3.25.0` at root and avoid any per-package
   `zod` entry to prevent workspaces from resolving two copies.

## Implementation order (strict TDD)

### Batch 0 — Prerequisites

- Edit `code/package.json` to add `@modelcontextprotocol/sdk@^1.29.0` and
  `zod@^3.25.0` under `dependencies`.
- Run `bun install` from `code/`.
- Commit: `chore(deps): add @modelcontextprotocol/sdk + zod for 06-mcp track`
  (include both `package.json` and `bun.lock`).

### Batch 0.5 — Shared fixture

- Write `code/packages/exercises/06-mcp/fixtures/research-server.ts`.
- `bunx tsc --noEmit` from `code/` — must be clean.
- Commit: `feat(exercises/06-mcp): add shared research-server fixture`.

### Batches 1–5 — Exercises 01…05

One exercise per batch, **strict TDD**:
1. Write `tests.test.ts` first (fail).
2. Write `starter.ts` (with `// Docs:` header) — tests still fail.
3. Write `solution.ts` — tests pass against `AIDEV_TARGET=solution`.
4. Write `meta.json` + `es/exercise.md` + `en/exercise.md`.
5. Run `aidev verify 06-mcp/NN-...` and `aidev verify ... --solution`.
6. Commit per exercise (`feat(exercises/06-mcp): add NN-...`).

### Batch 6 — Final validation

- `bunx tsc --noEmit` (workspace-wide).
- `bun test` (full suite).
- `aidev list` shows the full track.
- Review `git log` for conventional-commit hygiene.

## Open questions

1. **`bun.lock` churn**: adding the SDK will regenerate the lockfile, possibly
   touching transitive entries unrelated to our change. Apply phase should
   review the diff and flag anything that looks unrelated before committing.
2. **Claude Desktop integration as a Concepto extra**: exercise 01's concept
   section should briefly mention `claude_desktop_config.json` so learners know
   how to plug their server into a real MCP host after finishing the exercise.
   Not testable here, but high learner value.
