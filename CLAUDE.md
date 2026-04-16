# ai-dev-bootcamp — Project context

Read this file first when you start a session in this repo.

## What this is

Open source, rustlings-style CLI that teaches **senior devs** how to use AI tools (Claude API, prompt caching, tool use, RAG, agents, MCP) through **progressive exercises with automated tests against the real API**. Target learner: a 5+ year dev who can program but is new to the AI world.

Repo: https://github.com/JcOnSoftware/ai-dev-bootcamp (PRIVATE — ready for public flip).
License: MIT.

## Stack

- **Runtime**: Bun 1.3+
- **Language**: TypeScript 5.9 (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `allowImportingTsExtensions`)
- **AI SDK**: `@anthropic-ai/sdk ^0.40` (Claude-first; multi-provider later)
- **CLI**: `commander` + `@clack/prompts` + `picocolors`
  - `@clack/prompts` used in `aidev init` for API key input and locale select (interactive setup).
- **i18n**: zero-dependency module at `packages/cli/src/i18n/`. Locale resolved once per process in commander's `preAction` hook via `initI18n(locale)`. All CLI strings use `t(key, vars?)`. Supported locales: `es` (default), `en`. Static JSON dictionaries — no runtime JSON loading.
- **Locale resolution order**: `--locale <flag>` → `AIDEV_LOCALE` env var → `~/.aidev/config.json` → default `"es"`.
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
│       │       ├── index.ts       # commander entry (--locale root option + preAction hook)
│       │       ├── commands/      # init, list, verify, progress
│       │       ├── exercises.ts   # discovery of exercises (locale-aware)
│       │       ├── config.ts      # ~/.aidev/ persistence (locale field)
│       │       └── i18n/          # i18n module
│       │           ├── index.ts   # initI18n(), t(), getActiveLocale()
│       │           ├── types.ts   # SupportedLocale = "es" | "en"
│       │           ├── es.json    # Spanish dictionary (default locale)
│       │           └── en.json    # English dictionary
│       └── exercises/             # @aidev/exercises — content (30 exercises, all bilingual es+en)
│           ├── 01-foundations/     # 5 exercises: first-call, params, streaming, tokens-cost, error-handling
│           ├── 02-caching/        # 5 exercises: basic-caching → caching-with-tools
│           ├── 03-tool-use/       # 5 exercises: basic-tool → parallel-tools
│           ├── 04-rag/            # 5 exercises: embeddings-basics → citations-grounding
│           ├── 05-agents/         # 5 exercises: agent-loop → self-correction
│           └── 06-mcp/            # 5 exercises: mcp-server-basics → mcp-in-agent-loop
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

Every exercise has these files at its root plus one `exercise.md` per declared locale:

| File | Purpose |
|---|---|
| `<locale>/exercise.md` | Learner-facing statement, per locale. At least `es/` required. 6 required sections per locale. |
| `starter.ts` | TODO template. MUST have a `// Docs:` comment header with canonical URLs. Locale-neutral. |
| `solution.ts` | Reference implementation. Locale-neutral. |
| `tests.test.ts` | Uses `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET` env |
| `meta.json` | `{ id, track, title, version, valid_until, concepts, estimated_minutes, requires, locales }` |

**`locales` field** (required in `meta.json`): non-empty array of `"es" | "en"`. At minimum `["es"]`. Must match the locale subdirs present on disk.

**Canonical doc URLs**: `docs.claude.com/...` — NOT `docs.anthropic.com` (301-redirects).
**Default model in solutions**: Haiku (cost discipline — bootcamp should total ~$2 end-to-end).

## Harness contract

- Exercise exports `default async function run()` — harness imports + invokes.
- Harness monkey-patches `Anthropic.Messages.prototype.create` to capture `{ request, response }` per call.
- Tests assert on **structure** (model used, tools, params, shape) — NOT on literal LLM text (non-deterministic).
- `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET=starter|solution` switches target without file swaps.

## CLI (`aidev`)

```
aidev init                           # setup API key + locale → ~/.aidev/config.json (includes welcome, reset, update)
aidev list [--locale es|en]          # list exercises grouped by track (interactive picker)
aidev open [<id>] [--locale es|en]   # open exercise in editor (no arg = interactive picker with progress)
aidev next [--locale es|en]          # open first incomplete exercise
aidev verify <id> [--locale es|en]   # run tests; record progress on pass
aidev verify <id> --solution [--locale es|en]  # run against solution.ts (no progress)
aidev progress [--locale es|en]      # dashboard with per-track completion
aidev run <id> [--solution] [--stream-live] [--full] [--locale es|en]  # execute for inspection (no progress recorded)
```

`--locale` can be placed before or after the subcommand (`aidev --locale en list` OR `aidev list --locale en`).

**Locale env var**: `AIDEV_LOCALE=en aidev list` — overridden by `--locale` flag if both supplied.

**API key resolution**: `process.env.ANTHROPIC_API_KEY` → `~/.aidev/config.json`.

## Testing

- **Strict TDD Mode: ENABLED**
- Test runner: `bun test` (use `./` prefix if filename doesn't contain `.test`/`.spec`)
- Integration tests hit real API. Guard `ANTHROPIC_API_KEY` in `beforeAll`.
- Typecheck: `bunx tsc --noEmit` from `code/`

## State of play

- **v1 COMPLETE**: 30 exercises across 6 tracks, all bilingual (es + en).
  - **01-foundations** (5): first-call, params, streaming, tokens-cost, error-handling
  - **02-caching** (5): basic-caching, cache-hit-metrics, multi-breakpoint, ttl-extended, caching-with-tools
  - **03-tool-use** (5): basic-tool, tool-loop, multiple-tools, tool-choice, parallel-tools
  - **04-rag** (5): embeddings-basics, vector-search, chunking-strategies, retrieval-pipeline, citations-grounding
  - **05-agents** (5): agent-loop, stop-conditions, state-management, multi-step-plan, self-correction
  - **06-mcp** (5): mcp-server-basics, mcp-client-connect, resources-and-prompts, tools-with-mcp, mcp-in-agent-loop
- **i18n**: implemented, verified, archived (`openspec/changes/archive/2026-04-14-add-i18n-support/`).
- **CLI**: full command set — init (welcome/reset/update), list (interactive picker), open, next, verify, progress, run.
- **Next**:
  - Issue #3: quarterly MODEL_PRICES refresh in cost.ts
  - Multi-editor support for `aidev open`/`next` (currently VS Code only)
  - Public flip (all prerequisites met)

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
| `sdd/add-i18n-support/*` | Archived — proposal, spec, design, tasks, apply-progress (all complete) |
| `sdd/add-rag-track/*` | Archived — track 04-rag (5 exercises) |
| `sdd/add-agents-track/*` | Archived — track 05-agents (5 exercises) |
| `sdd/add-mcp-track/*` | Archived — track 06-mcp (5 exercises) |

Retrieve full content with `mem_search(query: "<topic>", project: "new-tool")` → `mem_get_observation(id)`.

## When in doubt

- **Adding an exercise** → read `docs/EXERCISE-CONTRACT.md`. Exercises that follow the contract do NOT need SDD.
- **Big architectural change** (new track, new command category, i18n, multi-provider) → use SDD via `/sdd-new <change>`.
- **Small fix** (typo, doc link, version bump) → direct edit + conventional commit.
