# ai-dev-bootcamp

> [🇪🇸 Leé esto en español →](./README.es.md)

**Rustlings for AI devs.** A hands-on AI engineering bootcamp for experienced developers — learn Claude through 30 progressive exercises with automated tests against the real Anthropic API.

**Start with API fundamentals. Then learn tool use with classic examples like calculator and weather. Then scale up to RAG, agents, and MCP servers.**

Most AI learning resources are either too basic ("prompt engineering for beginners") or too abstract (4-hour video courses on LLM theory). This is for the opposite audience: devs with 5+ years of experience who can code, but haven't built anything serious with AI yet. You learn by **writing code, running it against the real API, and watching tests go green** — not by watching someone else type.

## The curriculum — 6 tracks, 30 exercises

**Track 01 — Foundations** (5 exercises) — your first call, params, streaming, tokens & cost, error handling.

**Track 02 — Prompt caching** (5 exercises) — `cache_control`, hit metrics, multi-breakpoint, extended TTL, caching + tools.

**Track 03 — Tool use** (5 exercises) — defining tools, tool loop, multi-tool router, `tool_choice` modes, parallel tool use. Classic `get_weather` + `calculate` domain.

**Track 04 — RAG** (5 exercises) — embeddings with Voyage AI, vector search, chunking strategies, end-to-end retrieval pipeline, citation grounding.

**Track 05 — Agents** (5 exercises) — DIY agent loop (think→act→observe), layered stop conditions, state management, multi-step planning, self-correction.

**Track 06 — MCP** (5 exercises) — build an MCP server, connect a client, expose resources + prompt templates, bridge MCP tools to Claude, run a full agent loop over MCP-backed tools.

Each exercise has a `starter.ts` (TODOs to implement), a `solution.ts` (reference), `tests.test.ts` (structural assertions against the real API), and bilingual `exercise.md` (Spanish + English).

## Quick start

Requires [Bun](https://bun.com) 1.3+ (Mac, Linux, Windows), [VS Code](https://code.visualstudio.com/) (for `aidev open` and `aidev next`), and an Anthropic API key from <https://console.claude.com/settings/keys>. Track 04 (RAG) also needs a free Voyage AI key from <https://dash.voyageai.com/api-keys> — 200M tokens/month free tier.

```bash
gh repo clone JcOnSoftware/ai-dev-bootcamp
cd ai-dev-bootcamp/code
bun install
cat > .env <<EOF
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...        # only required for track 04
EOF

# Short form — works from anywhere inside code/:
bun run aidev init              # configure locale (es/en)
bun run aidev list              # see all 30 exercises grouped by track
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

## Working on exercises

No need to navigate deep folder paths — the CLI handles that for you:

```bash
bun run aidev open                  # interactive picker — browse all exercises and open one
bun run aidev open 01-first-call    # open a specific exercise directly in VS Code
bun run aidev next                  # open the next incomplete exercise automatically
```

`open` and `next` launch VS Code with two files: `starter.ts` (where you code) and `exercise.md` (the problem statement in your locale). Implement the TODOs, then run `verify` until tests pass.

> **Editor support**: `aidev open` and `aidev next` use VS Code by default. You can override with `$VISUAL` or `$EDITOR` environment variables.

## Playground mode

Want to **see** the model's output, not just pass tests? Use `aidev run`:

```bash
bun run aidev run 01-first-call --solution
bun run aidev run 03-streaming --solution --stream-live
```

`--stream-live` prints tokens as they arrive, so you can watch streaming in real time — the same UX your future users will experience.

## Cost

Every exercise defaults to **Claude Haiku** — the cheapest, fastest tier.
- Completing the full bootcamp (30 exercises × solve + verify once): **well under $0.10 total**.
- Voyage embeddings in track 04: free tier covers learner usage entirely ($0).
- Every `aidev run` prints the exact tokens and cost estimate for that call.

## Bilingual content

Exercise content ships in **Spanish and English**. The default locale is `es` (LATAM first) — override with `--locale en` on any command, set `AIDEV_LOCALE=en`, or pick during `aidev init`.

## Project status

- **v1 complete**: 6 tracks × 5 exercises = 30 total. CLI (`init`, `list`, `verify`, `run`, `progress`, `open`, `next`) + bilingual es/en content + GitHub Actions CI + weekly health check against real APIs.
- **Distribution**: git-clone-first (rustlings model) — the exercises ARE the repo. `git pull` updates content; `fork + PR` is the contribution path.
- **Rate-limit caveat for track 04**: Voyage free tier is 3 RPM/10K TPM without a payment method. Run exercises one at a time (~40s apart). Adding a payment method unlocks standard limits while staying $0 under the 200M free-token budget.

Follow progress in [Issues](https://github.com/JcOnSoftware/ai-dev-bootcamp/issues) and the `openspec/` directory (Spec-Driven Development artifacts for substantial changes).

## Contributing

New exercises, bug fixes, translations — all welcome. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup, tests, commit conventions, and how to author a new exercise per the contract.

## License

[MIT](./LICENSE)
