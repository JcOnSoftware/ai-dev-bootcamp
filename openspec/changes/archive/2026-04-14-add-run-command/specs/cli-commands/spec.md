# Delta for cli-commands

## ADDED Requirements

### Requirement: run subcommand registration

The system MUST register a `run` subcommand on the commander program root alongside `init`, `list`, `verify`, and `progress`.

The `run` subcommand MUST accept:
- Positional argument `<id>` (required) — exercise id
- Flag `--solution` (boolean) — execute `solution.ts` instead of `starter.ts`
- Flag `--stream-live` (boolean) — print streaming deltas in real-time
- Flag `--full` (boolean) — disable output truncation
- Flag `--locale <code>` (string) — per-invocation locale override

The `run` subcommand MUST inherit the root `--locale` flag via the existing `preAction` hook (same pattern as all other commands).

The `run` subcommand MUST NOT record progress under any flag combination.

The `run` subcommand MUST resolve `ANTHROPIC_API_KEY` using `resolveApiKey()` from `config.ts` (same as `verify`).

#### Scenario: Command registered and flags parsed

- GIVEN the commander program is initialized
- WHEN `aidev run 01-first-call --solution --stream-live --full --locale en` is parsed
- THEN `opts.solution === true`, `opts.streamLive === true`, `opts.full === true`
- AND the active locale is `en`
- AND the exercise id is `01-first-call`

#### Scenario: Locale from root flag

- GIVEN the user runs `aidev --locale en run 01-first-call`
- WHEN the `preAction` hook fires
- THEN locale is resolved to `en` (root flag, no per-command flag)
- AND the `run` action receives a correctly initialized `t()`
