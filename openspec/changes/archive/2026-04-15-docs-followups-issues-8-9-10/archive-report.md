# Archive Report: docs-followups-issues-8-9-10

**Change name**: `docs-followups-issues-8-9-10`
**Status**: archived
**Verification outcome**: passed (inline verification — no sub-agent)
**Archive date**: 2026-04-15

## What shipped

Three docs-only deltas bundled into a single SDD change, each shipped as its own conventional commit with `Closes #N` auto-closure:

- **#8 → commit `771dcd9`** `docs: normalize canonical doc host to docs.claude.com`
  - 18 files touched: `CLAUDE.md`, `CONTRIBUTING.md`, `.atl/skill-registry.md`, all 5 Foundations exercises (`starter.ts` + `es/exercise.md` + `en/exercise.md`).
  - Also fixed pre-redirect path artifacts (`/docs/en/api/...` → `/en/api/...`).
  - Archived openspec artifacts were intentionally NOT modified (immutable historical trail).
- **#9 → commit `e1b0c8f`** `docs(exercises/03-tool-use/04-tool-choice): document assertion pattern`
  - New "Por qué estos tests assertan sobre el request" / "Why these tests assert on the request" subsection in both `es/` and `en/` `exercise.md`.
  - Captures the design rationale: request-shape assertions > `stop_reason` flakiness.
- **#10 → commit `31f640a`** `docs(exercises/03-tool-use/05-parallel-tools): document parallel prompt strategy`
  - New "Estrategia de prompt" / "Prompt strategy" section in both `es/` and `en/` `exercise.md`.
  - Empirical prompt pattern that elicits parallel tool use from Haiku 4.5.
  - Mentions `disable_parallel_tool_use` as the inverse control knob.

## Verification (inline)

- `rg "platform\.claude\.com" code/ CLAUDE.md CONTRIBUTING.md .atl/` → **0 matches** ✓
- `rg "docs\.claude\.com/docs/" code/ CLAUDE.md CONTRIBUTING.md .atl/` → **0 matches** ✓
- `bunx tsc --noEmit` from `code/` → **clean** ✓
- `bun test packages/cli packages/runner` from `code/` → **104 pass, 0 fail** ✓

## Stats

- 3 commits on main
- 22 files touched (18 + 2 + 2)
- 0 code changes, 0 test changes, 0 meta.json bumps — pure docs
- 0 API cost (no integration runs needed)
- ~15 min wall time from proposal → archive

## No follow-up issues

All 3 input issues (#8, #9, #10) closed by this change. No new issues surfaced during the work. Repo's open issues list now contains only #3 (recurring quarterly MODEL_PRICES review).

## Engram topics

- `sdd/docs-followups-issues-8-9-10/proposal` — proposal summary
- `sdd/docs-followups-issues-8-9-10/spec` — spec summary
- `sdd/docs-followups-issues-8-9-10/archive-report` — this report

## Openspec paths

- `openspec/changes/archive/2026-04-15-docs-followups-issues-8-9-10/proposal.md`
- `openspec/changes/archive/2026-04-15-docs-followups-issues-8-9-10/spec.md`
- `openspec/changes/archive/2026-04-15-docs-followups-issues-8-9-10/archive-report.md` (this file)
