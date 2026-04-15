# Tasks: Add i18n Support (es/en)

> **Strict TDD forwarding**: the apply phase runs in Strict TDD Mode with test runner `bun test` from `code/`. Apply sub-agent must follow strict-tdd.md. Do NOT fall back to Standard Mode.
>
> **Apply-progress continuity**: if this change runs in multiple apply batches, each sub-agent MUST read prior progress from topic key `sdd/add-i18n-support/apply-progress` and MERGE (not overwrite) before saving.

---

## Phase 1: Infrastructure

- [x] 1.1 [IMPL] Create `code/packages/cli/src/i18n/types.ts` — export `SupportedLocale = "es" | "en"` and `SUPPORTED_LOCALES` constant
- [x] 1.2 [IMPL] Create `code/packages/cli/src/i18n/es.json` — full Spanish dictionary with all required keys
- [x] 1.3 [IMPL] Create `code/packages/cli/src/i18n/en.json` — full English dictionary with same key schema as es.json
- [x] 1.4 [VERIFY] Confirm `code/packages/cli/tsconfig.json` has `resolveJsonModule: true`

## Phase 2: Implementation — i18n runtime

- [x] 2.1 [TEST] Write unit tests for `i18n/index.ts` (RED)
- [x] 2.2 [IMPL] Create `code/packages/cli/src/i18n/index.ts`
- [x] 2.3 [VERIFY] Run `bun test` — all i18n unit tests pass

## Phase 3: Implementation — config + locale resolution

- [x] 3.1 [TEST] Write unit tests for `resolveLocale()` in `config.ts` (RED)
- [x] 3.2 [IMPL] Modify `code/packages/cli/src/config.ts`
- [x] 3.3 [VERIFY] Run `bun test` — all config tests pass

## Phase 4: Implementation — commander wiring

- [x] 4.1 [IMPL] Modify `code/packages/cli/src/index.ts` — add root `--locale` + `preAction` hook
- [x] 4.2 [IMPL] Add `--locale` option to each sub-command
- [x] 4.3 [TEST] Smoke integration test: `aidev --help` exits 0
- [x] 4.4 [VERIFY] Run `bun test`

## Phase 5: Implementation — exercises module

- [x] 5.1 [TEST] Write unit tests for `exercises.ts` (RED)
- [x] 5.2 [IMPL] Modify `code/packages/cli/src/exercises.ts`
- [x] 5.3 [VERIFY] Run `bun test`

## Phase 6: Content migration — 01-first-call

- [x] 6.1 [MIGRATE] `git mv exercise.md es/exercise.md`
- [x] 6.2 [MIGRATE] Author `en/exercise.md`
- [x] 6.3 [MIGRATE] Update `meta.json` — add `"locales": ["es", "en"]`
- [x] 6.4 [VERIFY] Run `bun test` — existing tests pass post-migration

## Phase 7: CLI commands integration

- [x] 7.1 [IMPL] Update `commands/init.ts`
- [x] 7.2 [IMPL] Update `commands/list.ts`
- [x] 7.3 [IMPL] Update `commands/verify.ts`
- [x] 7.4 [IMPL] Update `commands/progress.ts`
- [x] 7.5 [TEST] Add integration tests — locale-aware list/verify
- [x] 7.6 [VERIFY] Run `bun test`

## Phase 8: Docs

- [x] 8.1 [DOCS] Update `docs/EXERCISE-CONTRACT.md`
- [x] 8.2 [DOCS] Update project `CLAUDE.md`

## Phase 9: End-to-end verification

- [x] 9.1 [VERIFY] Full test suite `bun test` from `code/`
- [x] 9.2 [VERIFY] TypeScript type check `bunx tsc --noEmit`
- [x] 9.3 [VERIFY] Manual smoke: `AIDEV_LOCALE=en aidev list`
- [x] 9.4 [VERIFY] Manual smoke: `aidev verify 01-first-call --solution` in both locales
