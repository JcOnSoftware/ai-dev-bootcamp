# Contributing

Thanks for considering a contribution. This project is small and the review bar is "would a senior dev learn something solid from this?". Keep that goal in mind.

## Setup

Requirements:
- [Bun](https://bun.com) 1.3+
- An Anthropic API key — get one at <https://console.claude.com/settings/keys>

```bash
gh repo clone JcOnSoftware/ai-dev-bootcamp
cd ai-dev-bootcamp/code
bun install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env
```

> All `bun` / `bunx` commands MUST run from `code/` — not the repo root. Otherwise `bunx tsc` prints help instead of typechecking.

## Run tests

```bash
bunx tsc --noEmit     # must exit 0
bun test              # full unit + integration suite
```

Integration tests hit the real Anthropic API (Haiku, costs ~$0.001 per run). Running the full suite once costs well under 1 cent.

## CI

Two workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on every push/PR. Typecheck + `bun test packages/cli packages/runner` (no API key, no secrets). Integration tests skip automatically when `ANTHROPIC_API_KEY` is absent.
- **`health-check.yml`** — weekly cron (Monday 12:00 UTC) + manual dispatch. Runs the full suite including exercise integration tests against the real API. Requires the repo secret `ANTHROPIC_API_KEY` to be set (Settings → Secrets and variables → Actions). Catches SDK drift or model changes before users do.

## Try the CLI locally

```bash
bun run aidev list
bun run aidev verify 01-first-call --solution
bun run aidev run 03-streaming --solution --stream-live
```

The `aidev` npm script lives in `code/package.json` and points to `packages/cli/src/index.ts`. For a bare `aidev` command (no `bun run` prefix), alias `./bin/aidev` or add `code/bin` to your PATH — see README for the one-liner.

## Adding an exercise

Exercises are the primary contribution target. Read **[`docs/EXERCISE-CONTRACT.md`](./docs/EXERCISE-CONTRACT.md)** first — it's the formal contract. Every new exercise must ship with:

- `starter.ts`, `solution.ts`, `tests.test.ts`, `meta.json` at the exercise root
- `es/exercise.md` (required) and `en/exercise.md` (required before merge)
- A `Docs & references` section with canonical `docs.claude.com` URLs

Open an issue before investing real time, so we can agree on scope.

## Commit conventions

- **Conventional Commits only** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **Never add `Co-Authored-By` or AI attribution** — agents are tools, they don't author.
- Commits should be atomic. Prefer many small commits over one big one.
- Never skip hooks (`--no-verify`) without explicit discussion in the PR.

## Tests-first (Strict TDD)

For new logic (not docs, not pure config): write a failing test first, commit it, then write the minimum implementation to make it pass. The git log should show `test(…)` immediately followed by `feat(…)` for the same module.

## SDD for big changes

Substantial features (new tracks, cross-cutting refactors, new CLI commands) go through Spec-Driven Development. Artifacts live under `openspec/changes/` and `openspec/specs/`. See the archived examples in `openspec/changes/archive/` for reference.

You are NOT required to use SDD — a small PR with good tests is welcome. But if you do use it, you get more visibility and a cleaner review trail.

## Pull request checklist

Before opening a PR:

- [ ] Tests pass: `bunx tsc --noEmit` + `bun test` from `code/`
- [ ] The PR branch name is `feat/…`, `fix/…`, `docs/…` etc.
- [ ] Referenced a GitHub issue in the PR description (even for small changes)
- [ ] Exercise changes: `aidev verify <id>` fails on starter, passes on `--solution`
- [ ] Exercise changes: both `es/` and `en/` are present if adding a new exercise

## Questions

Open a [Discussion](https://github.com/JcOnSoftware/ai-dev-bootcamp/discussions) or an issue. I check most days.
