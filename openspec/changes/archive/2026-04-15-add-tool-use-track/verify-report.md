# Verify report — add-tool-use-track

**Date**: 2026-04-14
**Verifier**: sdd-verify agent
**Change**: add-tool-use-track
**Artifact store**: hybrid

---

## Verification outcome

**passed**

---

## Checks performed

### Gates

- **`bunx tsc --noEmit`** (from `code/`): PASS — zero errors
- **`bun test packages/cli packages/runner`**: PASS — 104 pass, 0 fail
- **`AIDEV_TARGET=solution bun test packages/exercises/03-tool-use/`**: PASS — 31 pass, 0 fail across 5 files (14.81s)
- **`git diff` scope**: PASS — 0 lines changed outside `packages/exercises/03-tool-use/`; harness, CLI, cost.ts, other tracks untouched

### Per-exercise spec compliance (5/5 exercises)

| Exercise | 6 files | meta.json correct | Docs: header | Structural assertions | es 6 sections | en 6 sections |
|---|---|---|---|---|---|---|
| 01-basic-tool | PASS | PASS | PASS | PASS | PASS | PASS |
| 02-tool-loop | PASS | PASS | PASS | PASS | PASS | PASS |
| 03-multiple-tools | PASS | PASS | PASS | PASS | PASS | PASS |
| 04-tool-choice | PASS | PASS | PASS | PASS | PASS | PASS |
| 05-parallel-tools | PASS | PASS | PASS | PASS | PASS | PASS |

**meta.json field verification**:
- `track: "03-tool-use"`: all 5 PASS
- `locales: ["es", "en"]`: all 5 PASS
- `valid_until: "2026-10-15"`: all 5 PASS
- `version: "1.0.0"`: all 5 PASS
- Requires chain (`01-first-call` → `01-basic-tool` → … → `04-tool-choice`): PASS

**Assertion style**:
- All `.toBe()` calls use API protocol constants (`"tool_use"`, `"end_turn"`, `"user"`, `"get_weather"`, `"calculate"`, `"multiply"`, `"any"`, `"none"`) — structural, not LLM text
- One permitted text assertion in 03-multiple-tools: `/5254|5,254/` — PASS (ADR-6 compliant)
- No other text content assertions found

### Tool schemas (design verbatim)

- `get_weather`: `name`, `location: string` (required), `unit: enum[celsius,fahrenheit]` — PASS in all exercises where used
- `calculate`: `name`, `operation: enum[add,subtract,multiply,divide]`, `a: number`, `b: number`, all required — PASS in 03-multiple-tools and 04-tool-choice

### Track structure

- `code/packages/exercises/03-tool-use/` exists: PASS
- 5 subdirs (`01-basic-tool` … `05-parallel-tools`): PASS
- `aidev list` groups all 5 under `03-tool-use` with correct titles: PASS

### Strict TDD compliance

- All 5 exercises: `tests.test.ts` present; per apply-progress, starter FAIL confirmed before solution GREEN for each batch
- Unit tests in 02/03 use dynamic import via `EXERCISE_FILE` (AIDEV_TARGET-aware): PASS

### Git hygiene

- 5 commits on main, one per exercise, conventional format (`feat(exercises/03-tool-use/<id>): ...`): PASS
- No `Co-Authored-By` lines in any commit: PASS
- `git status`: clean working tree (only untracked `openspec/changes/add-tool-use-track/` — expected SDD artifact)

---

## CRITICAL findings

None.

---

## WARNING findings

- **`openspec/` directory is untracked** — `openspec/changes/add-tool-use-track/` (5 artifact files) is untracked and will not be committed. If the team wants the full artifact trail in git history, add and commit these files before archiving. Not a blocker for the change itself.

---

## SUGGESTION findings

- **`docs.claude.com` vs `platform.claude.com`** — The CLAUDE.md mentions `platform.claude.com` as canonical, but the entire 02-caching track (and now 03-tool-use) uses `docs.claude.com`. The reference exercise `01-first-call` still uses `platform.claude.com`. Consider updating CLAUDE.md to reflect the actual established convention, or opening a follow-up to normalize all starters to one domain.
- **04-tool-choice test asserts `tool_choice.type === "none"` on the request** (not just the absence of `tool_use` blocks). The spec risk register said to prefer the absence check to avoid flake — this is fine since the request field is deterministic (we set it), but documenting this as a deliberate choice would help future maintainers.
- **05-parallel-tools prompt is explicit** ("call the get_weather tool twice…") to force parallel behavior. Apply-progress notes this is required because Haiku doesn't reliably parallelize without instruction. Worth noting in `en/exercise.md` "Extra concept" section if not already done.

---

## Recommendation

**ready-to-archive**

All gates pass. 31 integration tests green. 5 spec-compliant exercises. No CRITICAL findings. One WARNING (openspec files untracked — low priority). Change is complete and safe to archive.

---

## Cost spent during verify

~$0.08 (31 integration test calls to claude-haiku-4-5-20251001; verify phase itself makes no direct API calls)
