---
source: engram
archived_at: 2026-04-14
engram_topic: sdd/add-i18n-support/proposal
---

# Proposal: Add i18n Support (es/en)

## Intent

ai-dev-bootcamp targets a LATAM-first OSS community but also expects global adoption once public. Today all exercise content and CLI strings are Spanish-only and live at fixed paths (`exercise.md`). We need a locale-aware content layout and CLI surface BEFORE the repo flips to public, so contributors can add translations without breaking the exercise contract. Default locale is `es` (primary audience); `en` is required before public flip.

## Scope

### In Scope
- Per-locale exercise content: `<exercise>/{es,en}/exercise.md` (replaces root-level `exercise.md`).
- CLI string dictionaries: `code/packages/cli/src/i18n/{es,en}.json` + `t(key, vars?)` helper at `code/packages/cli/src/i18n/index.ts`.
- Locale resolution: `--locale` flag → `AIDEV_LOCALE` env → `~/.aidev/config.json` → default `es`.
- `aidev init` prompts locale (clack select) and persists to config.
- `aidev list` / `aidev verify` use `t()` and print path to active locale's `exercise.md`.
- `meta.json` gains `"locales": [...]` (min `["es"]`).
- Migrate `01-first-call`: move current `exercise.md` → `es/exercise.md`, add `en/exercise.md`.
- Update `docs/EXERCISE-CONTRACT.md` to reflect locale subdirs + `locales` field.

### Out of Scope
- Translating `README.md`, `docs/PLAN.md`, `docs/EXERCISE-CONTRACT.md` (maintainer docs).
- Translating `starter.ts` / `solution.ts` — source code stays neutral English (URLs + brief comments).
- Locales beyond `es` and `en`.
- New exercises (separate change).

## Capabilities

### New Capabilities
- `i18n-runtime`: locale resolution chain, `t()` helper, JSON dictionary loader for CLI strings.
- `localized-exercise-content`: per-locale `exercise.md` subdir layout + `meta.locales` field.

### Modified Capabilities
- `cli-commands`: `init` prompts locale; `list`/`verify` render via `t()` and resolve locale-scoped `exercise.md`.
- `exercise-contract`: contract doc gains locale subdir rule + `locales` field.

## Approach

Two orthogonal i18n tracks. (1) Content: each exercise folder gains `{locale}/exercise.md` subdirs; loader resolves by active locale with fallback to first entry in `meta.locales`. (2) CLI strings: tiny key-based `t()` helper reading a locale JSON at startup — no runtime framework (i18next etc.), keep it ~50 LOC. Locale chosen once at process start via resolution chain; passed down explicitly where needed.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `code/packages/cli/src/i18n/` | New | `index.ts` helper + `es.json` + `en.json` |
| `code/packages/cli/src/commands/init.ts` | Modified | Add locale prompt, persist to config |
| `code/packages/cli/src/commands/list.ts` | Modified | Use `t()`, resolve locale-scoped exercise.md |
| `code/packages/cli/src/commands/verify.ts` | Modified | Use `t()`, resolve locale-scoped exercise.md |
| `code/packages/cli/src/config.ts` | Modified | Add `locale` field + resolution chain |
| `code/packages/exercises/01-foundations/01-first-call/` | Modified | Move `exercise.md` → `es/`; add `en/exercise.md`; update `meta.json` |
| `docs/EXERCISE-CONTRACT.md` | Modified | Document locale subdirs + `meta.locales` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Contributors add `es` only, leaving `en` stub empty | High | Verify step checks that every locale in `meta.locales` has a non-empty `exercise.md`; public-flip gate requires `en` |
| `t()` helper over-engineered (ICU, plurals, interpolation libs) | Med | Cap API at `t(key, vars?)` with `{var}` templating only; no deps |
| `--locale xx` for unsupported locale confuses users | Med | Resolve with clear error listing supported locales; fall back to default with warning |
| Exercise contract churn breaks existing `01-first-call` during migration | Low | Migration is part of this change; verify tests pass after move before merging |

## Rollback Plan

Pure additive + one content move. Rollback = `git revert` the change's commit(s) + delete engram topic keys under `sdd/add-i18n-support/*`. No user-state migration needed: `~/.aidev/progress.json` is untouched; `~/.aidev/config.json` gains an optional `locale` field that older CLI versions ignore.

## Dependencies

- None external. Uses existing `@clack/prompts` for init locale select.

## Success Criteria

- [ ] `aidev init` prompts locale and writes it to `~/.aidev/config.json`.
- [ ] `aidev list` / `aidev verify` output strings in selected locale via `t()`.
- [ ] `--locale en` and `AIDEV_LOCALE=en` both override config.
- [ ] `01-first-call` has working `es/exercise.md` + `en/exercise.md`; existing tests still pass.
- [ ] `meta.json` validates with `"locales": ["es","en"]`.
- [ ] `docs/EXERCISE-CONTRACT.md` reflects new layout.
- [ ] Typecheck clean (`bunx tsc --noEmit` from `code/`); `bun test` green.
