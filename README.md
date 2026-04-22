# ai-dev-bootcamp

> [🇪🇸 Leé esto en español →](./README.es.md)

**Rustlings for AI devs.** A hands-on AI engineering bootcamp for experienced developers — learn to build real AI systems through 90 progressive exercises with automated tests against real APIs.

Choose your provider: **Anthropic (Claude)**, **OpenAI (GPT)**, or **Google (Gemini)**. Each has 6 tracks × 5 exercises (30 per provider, 90 total), bilingual (English + Spanish), with tests that validate against the real API.

Most AI learning resources are either too basic ("prompt engineering for beginners") or too abstract (4-hour video courses on LLM theory). This is for the opposite audience: devs with 5+ years of experience who can code, but haven't built anything serious with AI yet. You learn by **writing code, running it against the real API, and watching tests go green** — not by watching someone else type.

## The curriculum — 3 providers supported

### Anthropic (Claude) — 6 tracks, 30 exercises

| Track | Exercises |
|-------|-----------|
| **01 — Foundations** | First call, params, streaming, tokens & cost, error handling |
| **02 — Prompt caching** | `cache_control`, hit metrics, multi-breakpoint, extended TTL, caching + tools |
| **03 — Tool use** | Defining tools, tool loop, multi-tool router, `tool_choice` modes, parallel tools |
| **04 — RAG** | Embeddings (Voyage AI), vector search, chunking, retrieval pipeline, citations |
| **05 — Agents** | Agent loop, stop conditions, state management, multi-step planning, self-correction |
| **06 — MCP** | MCP server, client, resources + prompts, MCP tools → Claude, full agent loop |

### OpenAI (GPT) — 6 tracks, 30 exercises

| Track | Exercises |
|-------|-----------|
| **01 — Foundations** | First chat completion, model selection, token usage & cost, streaming deltas, structured outputs |
| **02 — Context management** | Context window limits, truncation strategies, conversation memory, summarization loops, cached tokens monitoring |
| **03 — Function calling** | JSON schema tools, tool calls loop, multi-tool routing, parallel execution, tool choice control |
| **04 — RAG** | OpenAI embeddings, chunking strategies, vector search, retrieval pipeline, citations & grounding |
| **05 — Agents** | Planner-executor, multi-step reasoning, state management, self-correction, tool orchestration |
| **06 — Evals & production** | Prompt evaluation, regression testing, output scoring, dataset testing, guardrails & validation |

### Google (Gemini) — 6 tracks, 30 exercises

| Track | Exercises |
|-------|-----------|
| **01 — Foundations** | First generate, model selection, token usage, streaming, structured output |
| **02 — Context caching** | Implicit caching, explicit `ai.caches` create/use, TTL updates, cost savings — Gemini-unique dual-mode track |
| **03 — Function calling** | Declare tools, close the response loop, route multiple tools, parallel calls, `toolConfig.mode` (AUTO/ANY/NONE) |
| **04 — RAG** | `embedContent` (3072-dim), cosine similarity, top-K search, chunking, full retrieve-then-generate pipeline |
| **05 — Agents** | Agent loop with MAX_TURNS, multi-step chains, plan-then-execute, conversation memory, error recovery |
| **06 — Advanced features** | `thinkingBudget`, Google Search grounding, code execution, URL context, safety settings |

Note: some track-02 and track-06 exercises require a paid-tier Gemini key (explicit caching, grounding, code execution). Track 01 runs on the free tier.

Each exercise has a `starter.ts` (TODOs to implement), a `solution.ts` (reference), `tests.test.ts` (structural assertions against the real API), and bilingual `exercise.md` (English + Spanish).

## Quick start

Requires [Bun](https://bun.com) 1.3+ (Mac, Linux, Windows). Any editor works — see [Supported editors](#supported-editors).

**API keys** — get one for the provider you pick:
- **Anthropic**: <https://console.claude.com/settings/keys>
- **OpenAI**: <https://platform.openai.com/api-keys>
- **Google (Gemini)**: <https://aistudio.google.com/apikey>

> Anthropic Track 04 (RAG) also needs a free Voyage AI key from <https://dash.voyageai.com/api-keys> — 200M tokens/month free tier.

```bash
gh repo clone JcOnSoftware/ai-dev-bootcamp
cd ai-dev-bootcamp/code
bun install
```

### How keys are resolved

All keys resolve in this order (first match wins):

1. **`process.env`** — whatever is exported in your shell
2. **`code/.env`** — auto-loaded by the CLI at startup (no matter where you run `aidev` from)
3. **`~/.aidev/config.json`** — written by `aidev init`

Use whichever fits. Typical setup:

```bash
aidev init              # picks provider + stores LLM key in ~/.aidev/config.json
```

If you're going to do the Anthropic RAG track (`04-rag`), add a Voyage key — `.env` is the easiest place:

```bash
echo "VOYAGE_API_KEY=pa-..." >> .env
```

**Convention**: LLM provider keys go through `aidev init` → `config.json`. External integration keys (Voyage today, future services tomorrow) go in `code/.env`. Both stores work for any key — the convention is about where each one *lives by default*. `aidev init` detects keys already present in your environment and skips the prompt for them, so set it once and forget about it.

### Enable the `aidev` command

```bash
# Mac / Linux:
bun run setup

# Windows PowerShell:
powershell -File bin/setup.ps1
```

### First run

```bash
aidev init                  # provider + API key + locale (en/es)
aidev list                  # browse exercises → pick one → opens in VS Code
aidev next                  # jump to your next incomplete exercise
```

## Working on exercises

| Command | What it does |
|---------|-------------|
| `aidev list` | Browse exercises grouped by track, pick one to open |
| `aidev open <id>` | Open a specific exercise in VS Code |
| `aidev open <id> --solution` | View the reference solution |
| `aidev open` | Interactive picker — browse and select |
| `aidev next` | Open the next incomplete exercise |
| `aidev verify <id>` | Run tests against your implementation |
| `aidev run <id>` | Execute and see model output |
| `aidev run <id> --stream-live` | Watch tokens arrive in real time |
| `aidev progress` | Dashboard with completion per track |
| `aidev init` | Reconfigure, reset progress, or update exercises |

**Provider flag**: add `--provider anthropic`, `--provider openai`, or `--provider gemini` to any command to override your default.

**Locale flag**: add `--locale es` or `--locale en` to any command.

**Editor flag**: add `--editor <binary>` to `open` or `next` for a one-off override (e.g. `aidev open 01-first-call --editor zed`).

## Supported editors

`aidev open` and `aidev next` open exercises in your editor. Configure it once with `aidev init` and it persists across sessions.

| Editor | Binary |
|--------|--------|
| VS Code | `code` |
| Cursor | `cursor` |
| Windsurf | `windsurf` |
| Antigravity | `antigravity` |
| Zed | `zed` |
| Neovim | `nvim` |
| WebStorm | `webstorm` |
| Custom | any binary name |

**Resolution order** (first match wins):

1. `--editor <binary>` flag
2. `AIDEV_EDITOR` environment variable
3. `$VISUAL` environment variable
4. `$EDITOR` environment variable
5. `editor` field in `~/.aidev/config.json` (set by `aidev init`)
6. Default: `code` (VS Code)

## Cost

Exercises use the cheapest models by default:
- **Anthropic**: Claude Haiku — full bootcamp well under $0.10
- **OpenAI**: gpt-4.1-nano — full bootcamp well under $0.10
- **Google (Gemini)**: gemini-2.5-flash-lite — same tier ($0.10 in / $0.40 out per 1M tokens)
- Voyage embeddings (Anthropic Track 04): free tier covers learner usage ($0)
- Every `aidev run` prints exact tokens and cost estimate

## Project status

- **v3.0 COMPLETE**: 3 providers × 6 tracks × 5 exercises = **90 total**. Anthropic + OpenAI + Gemini, full CLI, bilingual en/es content.
- **v2.0**: 2 providers (Anthropic + OpenAI), 60 exercises.
- **Distribution**: git-clone-first (rustlings model) — the exercises ARE the repo.

Follow progress in [Issues](https://github.com/JcOnSoftware/ai-dev-bootcamp/issues).

## Sister project

**[langchain-bootcamp](https://github.com/JcOnSoftware/langchain-bootcamp)** — Same hands-on style, framework-level. Learn LangChain (TypeScript) through 30 progressive exercises
 across 6 tracks: composition, RAG, agents, LangGraph, advanced patterns, and observability. Provider-agnostic curriculum (Anthropic · OpenAI · Gemini), choose at `lcdev init`.


## Contributing

New exercises, bug fixes, translations — all welcome. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup, tests, commit conventions, and how to author a new exercise per the contract.

## License

[MIT](./LICENSE)
