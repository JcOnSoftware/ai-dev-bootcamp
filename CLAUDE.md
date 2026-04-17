# ai-dev-bootcamp — Project context

Read this file first when you start a session in this repo.

## What this is

Open source, rustlings-style CLI that teaches **senior devs** how to use AI tools through **progressive exercises with automated tests against real APIs**. Supports **Anthropic (Claude)**, **OpenAI (GPT)**, and **Google (Gemini)**. Anthropic + OpenAI each ship 30 exercises (60 total). Gemini provider infra is live (v3.0) and exercises roll out track-by-track in follow-up PRs. Target learner: a 5+ year dev who can program but is new to the AI world.

Repo: https://github.com/JcOnSoftware/ai-dev-bootcamp (PUBLIC).
License: MIT.

## Stack

- **Runtime**: Bun 1.3+
- **Language**: TypeScript 5.9 (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `allowImportingTsExtensions`)
- **AI SDKs**: `@anthropic-ai/sdk ^0.40` + `openai ^4.86` + `@google/genai ^1.48` (tri provider)
- **CLI**: `commander` + `@clack/prompts` + `picocolors`
  - `@clack/prompts` used in `aidev init` for provider, API key, and locale selection.
- **Provider**: singleton at `packages/cli/src/provider/`. Mirrors i18n pattern. Resolved in `preAction` hook via `initProvider(provider)`.
- **Provider resolution order**: `--provider <flag>` → `AIDEV_PROVIDER` env var → `~/.aidev/config.json` → default `"anthropic"`.
- **Provider env vars + display names** live in `provider/types.ts` as `PROVIDER_ENV_VAR` and `PROVIDER_DISPLAY_NAME` records — use these instead of ad-hoc ternaries.
- **i18n**: zero-dependency module at `packages/cli/src/i18n/`. Locale resolved once per process in commander's `preAction` hook via `initI18n(locale)`. All CLI strings use `t(key, vars?)`. Supported locales: `en` (default), `es`. Static JSON dictionaries — no runtime JSON loading.
- **Locale resolution order**: `--locale <flag>` → `AIDEV_LOCALE` env var → `~/.aidev/config.json` → default `"en"`.
- **Monorepo**: Bun workspaces (no Nx/Turbo — YAGNI)
- **Tests**: `bun:test` built-in, convention `*.test.ts`

## Layout

```
ai-dev-bootcamp/
├── code/                          ← all source. RUN COMMANDS FROM HERE.
│   ├── package.json               # Bun workspaces root
│   ├── tsconfig.json
│   └── packages/
│       ├── runner/                # @aidev/runner — harness that intercepts SDK calls
│       │   └── src/
│       │       ├── harness.ts           # dispatcher (routes by AIDEV_PROVIDER)
│       │       ├── harness-anthropic.ts # monkey-patches Anthropic Messages.prototype
│       │       ├── harness-openai.ts    # monkey-patches OpenAI Completions.prototype
│       │       ├── harness-gemini.ts    # monkey-patches Gemini Models.prototype *Internal
│       │       └── types.ts             # shared types (HarnessResult, RunOptions)
│       ├── cli/                   # @aidev/cli — `aidev` binary
│       │   └── src/
│       │       ├── index.ts       # commander entry (--locale + --provider + preAction hook)
│       │       ├── commands/      # init, list, verify, progress, open, next, run
│       │       ├── exercises.ts   # discovery of exercises (provider + locale aware)
│       │       ├── config.ts      # ~/.aidev/ persistence (provider, locale, API keys)
│       │       ├── provider/      # provider module (mirrors i18n pattern)
│       │       │   ├── index.ts   # initProvider(), getActiveProvider()
│       │       │   └── types.ts   # SupportedProvider = "anthropic" | "openai" | "gemini"
│       │       └── i18n/          # i18n module
│       │           ├── index.ts   # initI18n(), t(), getActiveLocale()
│       │           ├── types.ts   # SupportedLocale = "es" | "en"
│       │           ├── es.json    # Spanish dictionary
│       │           └── en.json    # English dictionary (default)
│       └── exercises/             # @aidev/exercises — 60 exercises, all bilingual
│           ├── anthropic/         # 30 Anthropic exercises
│           │   ├── 01-foundations/ ├── 02-caching/ ├── 03-tool-use/
│           │   ├── 04-rag/        ├── 05-agents/  └── 06-mcp/
│           ├── openai/            # 30 OpenAI exercises
│           │   ├── 01-foundations/ ├── 02-context-management/ ├── 03-function-calling/
│           │   ├── 04-rag/        ├── 05-agents/             └── 06-evals-production/
│           └── gemini/            # infra ready (v3.0); exercises landing track-by-track
│               # planned: 01-foundations / 02-context-caching / 03-function-calling
│               #          04-rag / 05-agents / 06-live-multimodal
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
**Default model in solutions**: Haiku for Anthropic, gpt-4.1-nano for OpenAI (cost discipline — each provider's bootcamp under ~$0.10).

## Harness contract

- Exercise exports `default async function run()` — harness imports + invokes.
- Harness dispatcher (`harness.ts`) reads `AIDEV_PROVIDER` env and routes to the correct sub-harness:
  - **Anthropic**: `harness-anthropic.ts` patches `Messages.prototype.create/stream` → captures `CapturedCallAnthropic`
  - **OpenAI**: `harness-openai.ts` patches `Completions.prototype.create` + streaming proxy → captures `CapturedCallOpenAI`
  - **Gemini**: `harness-gemini.ts` patches `Models.prototype.*Internal` (`generateContentInternal`, `generateContentStreamInternal`, `embedContentInternal`) → captures `CapturedCallGemini`. **Gotcha**: Gemini public methods (`generateContent`, etc.) are instance-level bindings — patching the prototype for those names has no effect. Patch the `*Internal` variants that the public wrappers delegate to.
- Tests assert on **structure** (model used, tools, params, shape) — NOT on literal LLM text (non-deterministic).
- `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET=starter|solution` switches target without file swaps.

## CLI (`aidev`)

```
aidev init                           # provider + API key + locale → ~/.aidev/config.json (includes welcome, reset, update)
aidev list [--provider] [--locale]   # list exercises grouped by track (interactive picker)
aidev open [<id>] [--solution] [--provider] [--locale]  # open exercise in editor (no arg = picker)
aidev next [--provider] [--locale]   # open first incomplete exercise
aidev verify <id> [--provider] [--locale]  # run tests; record progress on pass
aidev verify <id> --solution         # run against solution.ts (no progress)
aidev progress [--provider] [--locale]  # dashboard with per-track completion
aidev run <id> [--solution] [--stream-live] [--full] [--provider] [--locale]  # execute for inspection
```

`--locale` and `--provider` can be placed before or after the subcommand.

**Provider resolution**: `--provider` flag → `AIDEV_PROVIDER` env → `config.provider` → default `"anthropic"`.
**Locale resolution**: `--locale` flag → `AIDEV_LOCALE` env → `config.locale` → default `"en"`.
**API key resolution**: `resolveApiKey(provider)` → env (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY`) → `~/.aidev/config.json`.

## Testing

- **Strict TDD Mode: ENABLED**
- Test runner: `bun test` (use `./` prefix if filename doesn't contain `.test`/`.spec`)
- Integration tests hit real API. Guard `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` in `beforeAll` (provider-dependent).
- Typecheck: `bunx tsc --noEmit` from `code/`

## State of play

- **v3.0 (current)**: Gemini provider infrastructure live. `@google/genai` SDK wired end-to-end — harness (`harness-gemini.ts`), cost table, render, i18n, init prompt, CI hooks. Exercises roll out track-by-track in follow-up PRs.
- **v2.0**: 60 exercises across 2 providers, all bilingual (en + es).
  - **Anthropic** (30): foundations, caching, tool-use, RAG, agents, MCP
  - **OpenAI** (30): foundations, context-management, function-calling, RAG, agents, evals-production
- **Multi-provider**: `--provider` flag, `AIDEV_PROVIDER` env, provider selection in init. Provider-scoped exercise directories + harness dispatcher.
- **i18n**: complete. Default locale: `en`.
- **CLI**: full command set — init (provider/key/locale + reset/update), list, open (--solution), next, verify, progress, run (--stream-live).
- **Repo**: PUBLIC. Branch protection active (PR + CI required, 0 approvals for solo dev).
- **Next**:
  - Gemini exercises — 6 tracks rolling out (01-foundations, 02-context-caching, 03-function-calling, 04-rag, 05-agents, 06-live-multimodal)
  - LangChain — deferred to post-Gemini as `07-frameworks` track (framework-level, ENCIMA de los SDKs nativos)
  - Issue #3: quarterly MODEL_PRICES refresh in cost.ts
  - Multi-editor support for `aidev open`/`next` (currently VS Code only)

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
| `sdd/add-i18n-support/*` | Archived — i18n support (all complete) |
| `sdd/add-rag-track/*` | Archived — Anthropic track 04-rag |
| `sdd/add-agents-track/*` | Archived — Anthropic track 05-agents |
| `sdd/add-mcp-track/*` | Archived — Anthropic track 06-mcp |
| `sdd/add-openai-provider-support/*` | Archived — multi-provider infra + 30 OpenAI exercises |
| `sdd/add-gemini-provider-support/*` | Infra shipped in v3.0 (explore/proposal/specs/design/tasks in engram + `openspec/changes/add-gemini-provider-support/`) |
| `ai-dev-bootcamp/gemini-harness-strategy` | B0 spike finding: patch `*Internal` methods on `Models.prototype`, not public methods |
| `ai-dev-bootcamp/roadmap-v3` | Decision: Gemini next, LangChain deferred to post-v3 `07-frameworks` track |

Retrieve full content with `mem_search(query: "<topic>", project: "new-tool")` → `mem_get_observation(id)`.

## When in doubt

- **Adding an exercise** → read `docs/EXERCISE-CONTRACT.md`. Exercises that follow the contract do NOT need SDD.
- **Big architectural change** (new track, new command category, i18n, multi-provider) → use SDD via `/sdd-new <change>`.
- **Small fix** (typo, doc link, version bump) → direct edit + conventional commit.
