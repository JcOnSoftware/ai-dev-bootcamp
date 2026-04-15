# Spec: docs-followups-issues-8-9-10

**Change name**: `docs-followups-issues-8-9-10`
**References**: `proposal.md`

## Delta 1 — URL host normalization (#8)

### Requirement
All live documentation and starter `// Docs:` comments MUST use `docs.claude.com` as the canonical host. `platform.claude.com` MUST NOT appear in non-archive files.

### Scope (files in-scope)
- `CLAUDE.md` (root)
- `CONTRIBUTING.md`
- `.atl/skill-registry.md`
- `code/packages/exercises/01-foundations/01-first-call/{starter.ts, es/exercise.md, en/exercise.md}`
- `code/packages/exercises/01-foundations/02-params/{starter.ts, es/exercise.md, en/exercise.md}`
- `code/packages/exercises/01-foundations/03-streaming/{starter.ts, es/exercise.md, en/exercise.md}`
- `code/packages/exercises/01-foundations/04-tokens-cost/{starter.ts, es/exercise.md, en/exercise.md}`
- `code/packages/exercises/01-foundations/05-error-handling/{starter.ts, es/exercise.md, en/exercise.md}`

### Scope (files out-of-scope)
- `openspec/changes/archive/**` — immutable historical artifacts.

### Testable criterion
```bash
rg "platform\.claude\.com" code/ CLAUDE.md CONTRIBUTING.md .atl/
# expected: 0 matches
```

### Implementation method
String replacement `platform.claude.com` → `docs.claude.com`. Path segments remain identical — the URL structure is compatible between hosts (both serve `/en/api/messages`, `/en/docs/...`, etc.).

## Delta 2 — Assertion pattern doc (#9)

### Requirement
`exercise.md` (both `es/` and `en/`) of `03-tool-use/04-tool-choice` MUST explain the deliberate assertion pattern used for the 4 `tool_choice` modes.

### Testable criterion
Both `es/exercise.md` and `en/exercise.md` of `04-tool-choice` MUST contain:
- A paragraph explicitly stating that tests assert on `request.tool_choice` shape (not response behavior).
- A paragraph stating that `tool_choice: none` is validated by the absence of `tool_use` content blocks rather than `stop_reason === "end_turn"`, citing `stop_reason` flake as the reason.

### Implementation method
Insert a subsection under "Concepto extra" / "Extra concept" titled "Por qué estos tests assertan sobre el request" / "Why these tests assert on the request".

## Delta 3 — Prompt strategy note (#10)

### Requirement
`exercise.md` (both `es/` and `en/`) of `03-tool-use/05-parallel-tools` MUST document the prompt-engineering reality of parallel tool use with Haiku 4.5.

### Testable criterion
Both files MUST contain:
- An empirical observation that Haiku 4.5 does not reliably emit parallel `tool_use` blocks without explicit instruction.
- The exact prompt pattern that elicits parallel behavior (e.g. "call the tool twice, once per city, in parallel").
- Note that tests accept `>= 1` tool_use blocks to tolerate model non-determinism.
- Mention `disable_parallel_tool_use` as the opposite direction (already present — verify it's there).

### Implementation method
Extend the existing "Concepto extra" / "Extra concept" section with a "Prompt strategy" subsection.

## Out of scope
- No changes to tests.test.ts (tests already encode the behavior; docs are catching up).
- No changes to meta.json (no version bump; these are non-breaking doc additions).
- No changes to any other exercise.

## Verification

Post-apply, run from repo root:
```bash
rg "platform\.claude\.com" code/ CLAUDE.md CONTRIBUTING.md .atl/         # 0
rg "tool_choice" code/packages/exercises/03-tool-use/04-tool-choice/es/exercise.md  # >= 1
rg "in parallel" code/packages/exercises/03-tool-use/05-parallel-tools/en/exercise.md # >= 1
```

Then from `code/`:
```bash
bunx tsc --noEmit   # must be clean (protects against starter.ts typos from URL replacement)
```
