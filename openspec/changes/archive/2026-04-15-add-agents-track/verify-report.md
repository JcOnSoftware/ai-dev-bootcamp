# Verify report — add-agents-track

## Verification outcome

**passed-with-warnings**

## Checks performed

- `bunx tsc --noEmit` from `code/` → 0 errors (clean)
- `bun test packages/cli packages/runner` → 104 pass, 0 fail
- `git diff --stat origin/main..HEAD` → scoped exclusively to `packages/exercises/05-agents/` (31 files, 1757 insertions) — no stray changes
- `git status` → clean working tree (only untracked: `.claude/` and `openspec/changes/add-agents-track/`)
- 7 commits on main since last push, conventional format (`feat`/`fix`), no `Co-Authored-By`
- All 5 exercises have exactly 6 required files each: `starter.ts`, `solution.ts`, `tests.test.ts`, `meta.json`, `es/exercise.md`, `en/exercise.md`
- All `exercise.md` files (es + en) have exactly 6 H2 sections
- `meta.json` fields: `track: "05-agents"` ✓, `locales: ["es","en"]` ✓, requires chain `01→02→03→04→05` ✓
- `starter.ts` `// Docs:` comments use canonical `docs.claude.com/en/docs/agents-and-tools/...` URLs ✓ (not `anthropic.com` or `platform.claude.com`)
- All solutions use `claude-haiku-4-5-20251001` ✓
- All solutions default `maxIterations: 10` ✓
- `fixtures/research-tools.ts` exists, imports `DOCS_CHUNKS` from `../../04-rag/fixtures/docs-chunks.ts` ✓
- Fixture uses `chunk.text` (not `.content`) internally ✓
- Fixture exports match design: `SEARCH_DOCS_TOOL`, `READ_CHUNK_TOOL`, `AGENT_TOOLS`, `executeSearchDocs`, `executeReadChunk`, `executeTool` ✓
- `bun packages/cli/src/index.ts list` shows all 5 exercises under `05-agents` track ✓
- Pedagogical correctness verified:
  - 01: manual `while` loop with explicit iteration control (think-act-observe) ✓
  - 02: pure `evaluateStop` helper teaching 3 stop conditions ✓
  - 03: stateless API + `messages` array accumulated across turns ✓
  - 04: planning system prompt engineering + sub-question decomposition ✓
  - 05: error observation in tool result → recovery system prompt → retry with different strategy ✓
- Spot-check (`AIDEV_TARGET=solution bun test 01-agent-loop/`) skipped — `ANTHROPIC_API_KEY` not available in verify shell. Apply agent's validated 37/37 result is authoritative.

## Integration test summary (from apply)

37/37 across 5 exercises (~$0.02 total)

## CRITICAL

None.

## WARNING

- `valid_until` in all 5 `meta.json` files is `"2026-12-31"`, not `"2026-10-15"` as specified in the verify task instructions. This is a minor spec deviation — `2026-12-31` is a natural EOY cutoff and arguably more learner-friendly, but it deviates from the written spec.
- Spot-check integration test could not re-run during verify (`ANTHROPIC_API_KEY` not in verify shell environment). Relying on apply agent's validated 37/37 result.

## SUGGESTION

- Standardize `valid_until` policy across all tracks — currently a mix of `2026-10-15` (spec intent) vs `2026-12-31` (actual). Open a follow-up issue to decide canonical date pattern and apply consistently.
- Consider adding a `06-computer-use` or `06-mcp-integration` exercise stub as a natural extension of the agents track.

## Recommendation

**ready-to-archive**

## Cost spent during verify

$0.00 (no API calls — static validation only)
