# ai-dev-bootcamp — Project context

Read this file first when you start a session in this repo.

## What this is

Open source, rustlings-style CLI that teaches **senior devs** how to use AI tools (Claude API, prompt caching, tool use, RAG, agents, MCP) through **progressive exercises with automated tests against the real API**. Target learner: a 5+ year dev who can program but is new to the AI world.

Repo: https://github.com/jcyovera/ai-dev-bootcamp (PRIVATE — flips to public after M3 complete + Foundations filled).
License: MIT.

## Stack

- **Runtime**: Bun 1.3+
- **Language**: TypeScript 5.9 (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `allowImportingTsExtensions`)
- **AI SDK**: `@anthropic-ai/sdk ^0.40` (Claude-first; multi-provider later)
- **CLI**: `commander` + `@clack/prompts` + `picocolors`
- **Monorepo**: Bun workspaces (no Nx/Turbo — YAGNI)
- **Tests**: `bun:test` built-in, convention `*.test.ts`

## Layout

```
ai-dev-bootcamp/
├── code/                          ← all source. RUN COMMANDS FROM HERE.
│   ├── package.json               # Bun workspaces root
│   ├── tsconfig.json
│   └── packages/
│       ├── runner/                # @aidev/runner — harness that intercepts Anthropic SDK
│       │   └── src/harness.ts     # monkey-patches Messages.prototype.create
│       ├── cli/                   # @aidev/cli — `aidev` binary
│       │   └── src/
│       │       ├── index.ts       # commander entry
│       │       ├── commands/      # init, list, verify, progress
│       │       ├── exercises.ts   # discovery of exercises
│       │       └── config.ts      # ~/.aidev/ persistence
│       └── exercises/             # @aidev/exercises — content
│           └── 01-foundations/
│               └── 01-first-call/ # reference exercise (M1)
├── docs/
│   ├── PLAN.md                    # original M1 plan (historical)
│   └── EXERCISE-CONTRACT.md       # REQUIRED READING before touching exercises
├── notes/TODO-next.md             # backlog
├── research/                      # investigations (empty)
└── .atl/skill-registry.md         # compact rules injected into sub-agents
```

## Critical rules (non-negotiable)

1. **Run `bun`/`bunx` commands from `code/`** — not from the workspace root. Otherwise `bunx tsc` prints help instead of typechecking.
2. **Modern CLI tools**: use `bat`, `eza`, `fd`, `rg`, `sd` — NOT `cat`, `ls`, `find`, `grep`, `sed`.
3. **Commits**: conventional commits only. **NEVER** add `Co-Authored-By` or AI attribution.
4. **Never build after changes** — tests verify correctness. Typecheck with `bunx tsc --noEmit`.
5. **Never skip hooks** (`--no-verify`, `--amend` on published commits, etc.) unless the user explicitly asks.
6. **Destructive git ops** (`reset --hard`, `push --force`, `branch -D`) require explicit user approval.

## Exercise contract (see `docs/EXERCISE-CONTRACT.md`)

Every exercise has exactly 5 files:

| File | Purpose |
|---|---|
| `exercise.md` | Learner-facing statement. 6 required sections (Concept, Docs & references, Tu tarea, Cómo verificar, Concepto extra) |
| `starter.ts` | TODO template. MUST have a `// Docs:` comment header with canonical URLs |
| `solution.ts` | Reference implementation |
| `tests.test.ts` | Uses `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET` env |
| `meta.json` | `{ id, track, title, version, valid_until, concepts, estimated_minutes, requires }` |

**Canonical doc URLs**: `platform.claude.com/...` — NOT `docs.anthropic.com` (301-redirects).
**Default model in solutions**: Haiku (cost discipline — bootcamp should total ~$2 end-to-end).

## Harness contract

- Exercise exports `default async function run()` — harness imports + invokes.
- Harness monkey-patches `Anthropic.Messages.prototype.create` to capture `{ request, response }` per call.
- Tests assert on **structure** (model used, tools, params, shape) — NOT on literal LLM text (non-deterministic).
- `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET=starter|solution` switches target without file swaps.

## CLI (`aidev`)

```
aidev init               # setup API key + locale → ~/.aidev/config.json
aidev list               # list exercises grouped by track
aidev verify <id>        # run tests; record progress on pass
aidev verify <id> --solution   # run tests against solution.ts (no progress recorded)
aidev progress           # dashboard with per-track completion
```

**API key resolution**: `process.env.ANTHROPIC_API_KEY` → `~/.aidev/config.json`.

## Testing

- **Strict TDD Mode: ENABLED**
- Test runner: `bun test` (use `./` prefix if filename doesn't contain `.test`/`.spec`)
- Integration tests hit real API. Guard `ANTHROPIC_API_KEY` in `beforeAll`.
- Typecheck: `bunx tsc --noEmit` from `code/`

## State of play

- **M1 + M2 complete**: harness, first exercise, CLI (init/list/verify/progress), exercise contract.
- **M3 in progress**: i18n (subdirs per locale, CLI string dicts, **default locale `es`** for LATAM), SDD init done.
- Active SDD change: `sdd/add-i18n-support/*` in engram (proposal stage).
- 3 remaining Foundations exercises (params, streaming, tokens/cost, error handling) land after M3.

## Persistence references

Engram is the memory backend. Key topics for this project (`project: "new-tool"`):

| Topic key | Content |
|---|---|
| `sdd-init/new-tool` | Full SDD context (stack, decisions, contract summary) |
| `sdd/new-tool/testing-capabilities` | Test runner + TDD mode + cost notes |
| `skill-registry` | Skill registry (also at `.atl/skill-registry.md`) |
| `ai-dev-bootcamp/overview` | Project overview memory |
| `ai-dev-bootcamp/milestone-1`, `milestone-2` | Completed milestones |
| `ai-dev-bootcamp/exercise-contract` | Pattern for exercise authoring |
| `sdd/add-i18n-support/*` | Active SDD change (proposal now, specs next) |

Retrieve full content with `mem_search(query: "<topic>", project: "new-tool")` → `mem_get_observation(id)`.

## When in doubt

- **Adding an exercise** → read `docs/EXERCISE-CONTRACT.md`. Exercises that follow the contract do NOT need SDD.
- **Big architectural change** (new track, new command category, i18n, multi-provider) → use SDD via `/sdd-new <change>`.
- **Small fix** (typo, doc link, version bump) → direct edit + conventional commit.
