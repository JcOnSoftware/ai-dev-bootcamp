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

Requires [Bun](https://bun.com) 1.3+ (Mac, Linux, Windows) and [VS Code](https://code.visualstudio.com/) (for `aidev open` and `aidev next`).

**API key** — you need one depending on your chosen provider:
- **Anthropic**: <https://console.claude.com/settings/keys>
- **OpenAI**: <https://platform.openai.com/api-keys>
- **Google (Gemini)**: <https://aistudio.google.com/apikey>

> Anthropic Track 04 (RAG) also needs a free Voyage AI key from <https://dash.voyageai.com/api-keys> — 200M tokens/month free tier.

```bash
gh repo clone JcOnSoftware/ai-dev-bootcamp
cd ai-dev-bootcamp/code
bun install
```

Set up your API key — pick **one** method:

```bash
# Anthropic:
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# OpenAI:
echo "OPENAI_API_KEY=sk-..." > .env

# Google (Gemini):
echo "GEMINI_API_KEY=AIza..." > .env

# Or export in your shell:
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AIza...
```

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

> **Editor**: VS Code (`code`) by default. Override with `$VISUAL` or `$EDITOR` env vars.

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

## Contributing

New exercises, bug fixes, translations — all welcome. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup, tests, commit conventions, and how to author a new exercise per the contract.

## License

[MIT](./LICENSE)
