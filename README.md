# ai-dev-bootcamp

> [🇪🇸 Leé esto en español →](./README.es.md)

**Rustlings for AI devs.** A hands-on AI engineering bootcamp for experienced developers — learn to build real AI systems through progressive exercises with automated tests against real APIs.

Choose your provider: **Anthropic (Claude)**, **OpenAI (GPT)**, or **Google (Gemini)**. Anthropic and OpenAI have 6 tracks × 5 exercises each (60 exercises total). Gemini provider support is live (v3.0) — exercises are landing track-by-track in follow-up PRs. All exercises are bilingual (English + Spanish), with tests that validate against the real API.

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

### Google (Gemini) — provider support live, exercises rolling out

v3.0 ships multi-provider infrastructure for Gemini (`@google/genai` SDK, streaming + embeddings harness, cost estimation, bilingual CLI). Exercises land track-by-track as separate PRs. Planned tracks:

| Track | Focus |
|-------|-------|
| **01 — Foundations** | `generateContent`, model selection, token usage, streaming, structured output |
| **02 — Context caching** | Implicit caching + explicit `ai.caches` — Gemini-unique dual mode |
| **03 — Function calling** | `functionDeclarations`, tool loops, JSON mode, parallel tools |
| **04 — RAG** | `embedContent` with `gemini-embedding-001` (3072-dim), cosine similarity, retrieval |
| **05 — Agents** | Agent loops, multi-step reasoning, planner-executor, memory |
| **06 — Live multimodal** | Live API (audio-to-audio realtime over WebSocket) — Gemini-unique |

Track progress in [the Issues board](https://github.com/JcOnSoftware/ai-dev-bootcamp/issues).

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

- **v3.0**: Gemini provider support (infra). Anthropic + OpenAI shipping 60 exercises; Gemini exercises land track-by-track in follow-up PRs.
- **v2.0**: 2 providers × 6 tracks × 5 exercises = 60 total. Full CLI + bilingual en/es content.
- **Distribution**: git-clone-first (rustlings model) — the exercises ARE the repo.

Follow progress in [Issues](https://github.com/JcOnSoftware/ai-dev-bootcamp/issues).

## Contributing

New exercises, bug fixes, translations — all welcome. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup, tests, commit conventions, and how to author a new exercise per the contract.

## License

[MIT](./LICENSE)
