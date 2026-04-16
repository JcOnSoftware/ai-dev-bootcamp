# Archive Report: add-mcp-track

**Change**: `add-mcp-track`
**Status**: `archived`
**Archive Date**: 2026-04-15
**Verification Outcome**: `passed-with-warnings` → W1 resolved (`b59ca19`) → ready-to-archive

## What Shipped

Track 06-mcp (final track, closes 6-track bootcamp) fully implemented across 5 progressive exercises + shared fixture. Dependencies added (`@modelcontextprotocol/sdk ^1.29.0`, `zod ^3.25.0`). All 30 required files present per contract. Two locales (es/en), 6 sections per exercise.md, canonical doc URLs verified, console.log corruption warnings in place. 104 existing + 18 new integration tests passing.

**Commits**:
- `05dc203` deps (@modelcontextprotocol/sdk + zod)
- `e2201ee` shared research-server fixture
- `ee57195`, `1685023`, `1fe2b23`, `b1088fd`, `dfb7fc3` — exercises 01–05
- `6294362` TS null cast fix
- `b59ca19` unused-imports cleanup (W1 fix)

## Stats

- **9 commits**, 18 integration tests, ~$0.015 apply cost (Haiku in 04–05 only; 01–03 zero cost)
- **Bootcamp now**: 6 tracks × 5 exercises = 30 total
- **git clean**, no Co-Authored-By, all exercise.meta.json valid_until 2026-10-15

## Key Learnings

- **@modelcontextprotocol/sdk v1.29.0 works on Bun** with `.js` subpath imports. No issues.
- **Zod peer dep required** by `McpServer.registerTool()` — auto-derives JSON Schema from plain shape.
- **InMemoryTransport.createLinkedPair()** eliminates subprocess flakiness — use for ALL tests.
- **console.log corrupts stdio JSON-RPC** — every server-side file MUST warn + use `console.error` for diagnostics.
- **Zod v4 $Infer + TS strict null**: `client.callTool()` returns `content: unknown`. Cast at call sites to `{ type: string; text?: string }[]`.
- **registerTool/registerResource/registerPrompt are modern APIs** — not deprecated `.tool()/.resource()/.prompt()`.
- **Manual MCP→Claude bridge ~5 lines** (translate `inputSchema` → `input_schema`). Zero pedagogical loss vs helper.
- **Cross-exercise imports leak coupling**: 05 imports from 04/solution.ts. Deferred to follow-up issue S1.

## Warnings & Suggestions Resolved

- **W1**: `04-tools-with-mcp/tests.test.ts` had unused `afterAll` import + no `.close()` call. Fixed in `b59ca19`.
- **S1 (deferred)**: `05-mcp-in-agent-loop/solution.ts` imports `mcpToolsToAnthropicFormat` from `../04-tools-with-mcp/solution.ts`. Cross-exercise coupling. Proposed: move to `fixtures/mcp-utils.ts`. Tracked in GitHub issue.
