# ai-dev-bootcamp

> [🇪🇸 Leé esto en español →](./README.es.md)

**Rustlings-style CLI that teaches senior devs how to use Claude through progressive hands-on exercises with automated tests against the real Anthropic API.**

Most AI learning resources are either too basic ("prompt engineering for beginners") or too abstract (4-hour video courses on LLM theory). This project is for the opposite: devs with 5+ years of experience who can code, but haven't built anything serious with AI yet. You learn by **writing code, running it against the real API, and watching tests go green** — not by watching someone else type.

## What you'll learn

**Track: Foundations** (5 exercises, ready now)

| # | Exercise | Concept |
|---|----------|---------|
| 01 | `01-first-call` | Your first Claude call — client, model, messages, response shape |
| 02 | `02-params` | Parameters: `temperature` for deterministic vs creative output |
| 03 | `03-streaming` | Streaming responses — event iteration, `finalMessage()`, real-time UX |
| 04 | `04-tokens-cost` | Read `usage`, compute real USD cost per call |
| 05 | `05-error-handling` | `withRetry` helper with exponential backoff, retryable vs fatal errors |

**Upcoming tracks** (v2): prompt caching · tool use · RAG · agents · MCP servers.

## Quick start

Requires [Bun](https://bun.com) 1.3+ and an Anthropic API key from <https://console.claude.com/settings/keys>.

```bash
gh repo clone jcyovera/ai-dev-bootcamp
cd ai-dev-bootcamp/code
bun install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env

# Configure locale (es/en), see available exercises, run one:
bun run packages/cli/src/index.ts init
bun run packages/cli/src/index.ts list
bun run packages/cli/src/index.ts verify 01-first-call
```

Open `packages/exercises/01-foundations/01-first-call/starter.ts` in your editor and implement the TODO. Re-run `verify` until tests pass. Read the full problem statement in `packages/exercises/01-foundations/01-first-call/{es,en}/exercise.md`.

## Playground mode

Want to **see** the model's output, not just pass tests? Use `aidev run`:

```bash
bun run packages/cli/src/index.ts run 01-first-call --solution
bun run packages/cli/src/index.ts run 03-streaming --solution --stream-live
```

`--stream-live` prints tokens as they arrive, so you can watch streaming in real time — the same UX your future users will experience.

## Cost

Every exercise defaults to **Claude Haiku** — the cheapest, fastest tier.
- Completing the full Foundations track (5 exercises × solve + verify once): **~$0.01 total**.
- Every `aidev run` prints the exact tokens and cost estimate for that call.

## Bilingual content

Exercise content ships in **Spanish and English**. The default locale is `es` (LATAM first) — override with `--locale en` on any command, or set `AIDEV_LOCALE=en`, or pick during `aidev init`.

## Project status

- **v1 shipped**: Foundations track (5 exercises), CLI (`init`, `list`, `verify`, `run`, `progress`), bilingual content.
- **v2 upcoming**: more tracks, npm-published binary, optional GitHub Actions CI for contributors.

Follow progress in [Issues](https://github.com/jcyovera/ai-dev-bootcamp/issues) and the `openspec/` directory (Spec-Driven Development artifacts for substantial changes).

## Contributing

New exercises, bug fixes, translations — all welcome. See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup, tests, commit conventions, and how to author a new exercise per the contract.

## License

[MIT](./LICENSE)
