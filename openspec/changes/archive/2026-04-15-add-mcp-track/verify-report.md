# Verify report — add-mcp-track

## Verification outcome

passed-with-warnings

## Checks performed

- **TypeScript (`bunx tsc --noEmit`)**: PASS — 0 errors
- **Unit/CLI/runner tests (`bun test packages/cli packages/runner`)**: PASS — 104 pass, 0 fail
- **Git diff scope**: PASS — only `code/packages/exercises/06-mcp/`, `code/package.json`, `code/bun.lock`, `openspec/changes/add-mcp-track/`. No leakage to harness, CLI, other tracks.
- **Track structure**: PASS — `06-mcp/` has 5 subdirs + `fixtures/`. CLI `list` shows all 5 under `▸ 06-mcp`.
- **6-file presence (all 5 exercises)**: PASS — `starter.ts`, `solution.ts`, `tests.test.ts`, `meta.json`, `es/exercise.md`, `en/exercise.md` all present.
- **`meta.json` correctness**: PASS — `track: "06-mcp"`, `locales: ["es","en"]`, `valid_until: "2026-10-15"` (correct, no drift to 2026-12-31). Requires chain: `01→"01-first-call"`, `02→"01-mcp-server-basics"`, `03→"02-mcp-client-connect"`, `04→"03-resources-and-prompts"`, `05→"04-tools-with-mcp"`.
- **`starter.ts` Docs: comments**: PASS — all 5 starters have `// Docs:` block with canonical `modelcontextprotocol.io/...` and `docs.claude.com/...` URLs. No `anthropic.com` or `platform.claude.com`.
- **`console.log` corruption warning**: PASS — present in `01/solution.ts`, `01/starter.ts`, `03/solution.ts`, `03/starter.ts`, `fixtures/research-server.ts`.
- **`exercise.md` section count (all 10 files)**: PASS — exactly 6 `##` sections in every locale file.
- **Model discipline (04, 05 solutions)**: PASS — both use `const MODEL = "claude-haiku-4-5-20251001"`.
- **`InMemoryTransport` in tests**: PASS — no `StdioClientTransport` in any `tests.test.ts`. (Mentioned as reference only in `02/solution.ts` and `02/exercise.md` — correct pedagogical framing.)
- **`client.close()` in `afterAll`**: PARTIAL — 01, 02, 03 have `afterAll(() => client.close())`. 04 imports `afterAll` but never calls it. 05 has no MCP client in tests (exercises the harness directly, no direct client lifecycle to manage). 04 is a WARNING.
- **Fixture compliance**: PASS — `fixtures/research-server.ts` exists; imports from `@modelcontextprotocol/sdk/server/mcp.js` and `zod`; imports `executeSearchDocs`, `executeReadChunk` from `../../05-agents/fixtures/research-tools.ts`; `console.log` warning at top; exports `createResearchServer(): McpServer` with 2 tools registered.
- **Deps compliance**: PASS — `code/package.json` has `"@modelcontextprotocol/sdk": "^1.29.0"` and `"zod": "^3.25.0"` in `dependencies`. `bun.lock` updated (+164 lines, no suspicious transitive bumps).
- **Cross-exercise import**: `05/solution.ts` line 10 imports `mcpToolsToAnthropicFormat` from `../04-tools-with-mcp/solution.ts` — confirmed. Marked SUGGESTION (see below).
- **Git hygiene**: PASS — 8 commits, conventional format (`chore`, `feat` prefixes), no `Co-Authored-By`. `git status` clean (untracked: `.claude/`, `openspec/changes/add-mcp-track/` — expected).
- **Pedagogical arc**: PASS — 01 server basics → 02 client → 03 resources+prompts → 04 bridge to Claude → 05 full agent loop. Logical progression.

## Integration test summary (from apply)

5 exercises, 18/18 pass. Exercises 01–03 cost $0 (InMemoryTransport only). Exercises 04–05 cost ~$0.01–0.015 total (Haiku 4.5).

## CRITICAL

None.

## WARNING

**W1 — `afterAll` imported but unused in `04-tools-with-mcp/tests.test.ts`**
The file has `import { ..., afterAll } from "bun:test"` on line 1 but `afterAll` is never called. The integration describe block creates an MCP `Client` instance that is never closed. Tests still pass (Bun GC cleans up), but the pattern is inconsistent with the rest of the track and could cause flakiness in long test runs. Fix: add `afterAll(async () => { await client.close(); })` inside the integration describe block, and remove the dead import if unused.

## SUGGESTION

**S1 — Move `mcpToolsToAnthropicFormat` to fixture to decouple 05 from 04**
`05-mcp-in-agent-loop/solution.ts` imports `mcpToolsToAnthropicFormat` from `../04-tools-with-mcp/solution.ts`. This creates a coupling: a learner whose `04/solution.ts` is broken or non-existent will get a runtime import error on exercise 05. The function is a pure utility (maps MCP tool schema to Anthropic `Tool` format) with no side effects.

**Proposed fix**: export `mcpToolsToAnthropicFormat` from `fixtures/research-server.ts` (or a new `fixtures/mcp-utils.ts`), and update `05/solution.ts` to import from `../fixtures/...`. This makes the fixture the shared foundation and removes the cross-exercise dependency. Low-risk refactor — no test changes needed.

## Recommendation

**ready-to-archive** — after W1 is fixed (1-line change to `04/tests.test.ts`). S1 can become a follow-up issue post-archive; it does not block archiving.

## Cost spent during verify

$0.00 (static analysis only)
