# ai-dev-bootcamp

> [🇪🇸 Leé esto en español →](./README.es.md)

**Rustlings-style CLI that teaches senior devs how to use Claude through progressive hands-on exercises with automated tests against the real Anthropic API.**

Most AI learning resources are either too basic ("prompt engineering for beginners") or too abstract (4-hour video courses on LLM theory). This project is for the opposite: devs with 5+ years of experience who can code, but haven't built anything serious with AI yet. You learn by **writing code, running it against the real API, and watching tests go green** — not by watching someone else type.

## What you'll learn

**Track 01 — Foundations** (5 exercises)

| # | Exercise | Concept |
|---|----------|---------|
| 01 | `01-first-call` | Your first Claude call — client, model, messages, response shape |
| 02 | `02-params` | Parameters: `temperature` for deterministic vs creative output |
| 03 | `03-streaming` | Streaming responses — event iteration, `finalMessage()`, real-time UX |
| 04 | `04-tokens-cost` | Read `usage`, compute real USD cost per call |
| 05 | `05-error-handling` | `withRetry` helper with exponential backoff, retryable vs fatal errors |

**Track 02 — Prompt caching** (5 exercises): `cache_control`, cache hit metrics, multi-breakpoint, extended TTL, caching + tools.

**Track 03 — Tool use** (5 exercises): defining tools, tool loop, multi-tool router, `tool_choice` modes, parallel tool use.

**Upcoming tracks**: RAG · agents · MCP servers.

## Quick start

Requires [Bun](https://bun.com) 1.3+ (Mac, Linux, Windows) and an Anthropic API key from <https://console.claude.com/settings/keys>.

```bash
gh repo clone JcOnSoftware/ai-dev-bootcamp
cd ai-dev-bootcamp/code
bun install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env

# Short form — works from anywhere inside code/:
bun run aidev init              # configure locale (es/en)
bun run aidev list              # see available exercises
bun run aidev verify 01-first-call
```

Prefer a bare `aidev` command without the `bun run` prefix? Two options:

```bash
# Option A — shell alias (Mac/Linux/WSL):
alias aidev="$(pwd)/bin/aidev"
aidev list

# Option B — add code/bin to your PATH:
export PATH="$(pwd)/bin:$PATH"     # Mac/Linux
# Windows PowerShell: $env:Path = "$PWD\bin;$env:Path"
aidev list
```

Open `packages/exercises/01-foundations/01-first-call/starter.ts` in your editor and implement the TODO. Re-run `verify` until tests pass. Read the full problem statement in `packages/exercises/01-foundations/01-first-call/{es,en}/exercise.md`.

## Playground mode

Want to **see** the model's output, not just pass tests? Use `aidev run`:

```bash
bun run aidev run 01-first-call --solution
bun run aidev run 03-streaming --solution --stream-live
```

`--stream-live` prints tokens as they arrive, so you can watch streaming in real time — the same UX your future users will experience.

## Cost

Every exercise defaults to **Claude Haiku** — the cheapest, fastest tier.
- Completing the full Foundations track (5 exercises × solve + verify once): **~$0.01 total**.
- Every `aidev run` prints the exact tokens and cost estimate for that call.

## Bilingual content

Exercise content ships in **Spanish and English**. The default locale is `es` (LATAM first) — override with `--locale en` on any command, or set `AIDEV_LOCALE=en`, or pick during `aidev init`.

## Project status

- **v1 shipped**: 3 tracks × 5 exercises = 15 total (Foundations, Prompt caching, Tool use). CLI (`init`, `list`, `verify`, `run`, `progress`) + bilingual es/en content + GitHub Actions CI + weekly health check.
- **Next**: RAG · agents · MCP tracks. Distribution stays git-clone-first (rustlings model) — the exercises ARE the repo.

Follow progress in [Issues](https://github.com/JcOnSoftware/ai-dev-bootcamp/issues) and the `openspec/` directory (Spec-Driven Development artifacts for substantial changes).

## Contributing

New exercises, bug fixes, translations — all welcome. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup, tests, commit conventions, and how to author a new exercise per the contract.

## License

[MIT](./LICENSE)
