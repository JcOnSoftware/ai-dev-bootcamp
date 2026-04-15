---
source: engram
archived_at: 2026-04-14
engram_topic: sdd/add-i18n-support/design
---

# Design: Add i18n Support (es/en)

## 1. Overview

Two orthogonal layers. (A) A tiny `i18n/` module under `packages/cli/src/` with a one-shot `initI18n(locale)` plus a sync `t(key, vars?)` helper backed by statically-imported JSON dictionaries. (B) A locale-aware content resolver in `exercises.ts` that maps `meta.locales` to `<locale>/exercise.md` subdirs with a runtime `es` fallback.

Locale is resolved ONCE per process via commander's `preAction` hook, using the precedence flag > env > config > `"es"`. The hook validates the resolved value against `SupportedLocale` and calls `initI18n()` BEFORE any command action runs, so every `t()` inside actions is deterministic and synchronous. No i18n framework, no async bootstrapping, ~50 LOC total for the module.

## 2. Component diagram (ASCII)

```
                   process.argv
                        │
                        ▼
   ┌──────────────────────────────────────────┐
   │  bin/aidev (index.ts) — commander root   │
   │    .option("--locale <code>")            │
   │    .hook("preAction", resolveAndInit)    │
   └──────────────┬───────────────────────────┘
                  │ preAction
                  ▼
   ┌──────────────────────────┐     reads
   │  config.ts               │◀───────────┐
   │    resolveLocale()       │            │
   │    readConfig()          │            │
   └──────────┬───────────────┘            │
              │ SupportedLocale            │
              ▼                            │
   ┌──────────────────────────┐    loads   │
   │  i18n/index.ts           │─── static ─▶  i18n/{es,en}.json
   │    initI18n(locale)      │    import
   │    t(key, vars?)         │
   │    getActiveLocale()     │
   └──────────┬───────────────┘
              │ used by
              ▼
   ┌──────────────────────────────────────┐
   │  commands/{init,list,verify,progress}│
   │    t("list.empty") etc.              │
   └──────────┬───────────────────────────┘
              │ calls
              ▼
   ┌──────────────────────────┐
   │  exercises.ts            │
   │    listExercises()       │  ← emits discovery warnings (dedup Set)
   │    findExercise()        │
   │    exerciseDocPath(ex,l) │  ← silent fallback to es at runtime
   └──────────────────────────┘
```

## 3. Locale resolution sequence

```
User          aidev          commander       config.ts      i18n/index.ts      action
 │  cmd+flag   │                │                │                │              │
 │────────────▶│ parseAsync     │                │                │              │
 │             │───preAction───▶│                │                │              │
 │             │                │ resolveLocale()│                │              │
 │             │                │───────────────▶│  flag?env?cfg? │              │
 │             │                │                │──SupportedLoc──▶              │
 │             │                │  validate or exit(1)            │              │
 │             │                │─────────── initI18n(locale) ───▶│              │
 │             │                │                │      dict set, active=locale  │
 │             │                │◀───────────────────────────────│              │
 │             │──── invoke action ────────────────────────────────────────────▶│
 │             │                │                │                │   t("...")   │
 │             │                │                │                │◀─────────────│
```

## 4. Module: `packages/cli/src/i18n/`

File layout:
- `index.ts` — public API (~50 LOC)
- `es.json`, `en.json` — dictionaries
- `types.ts` — `SupportedLocale`, `SUPPORTED_LOCALES`

Public API (signatures, not impl):
```ts
export type SupportedLocale = "es" | "en";
export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ["es", "en"];
export function initI18n(locale: SupportedLocale): void;
export function t(key: string, vars?: Record<string, string>): string;
export function getActiveLocale(): SupportedLocale;
```

Key schema (top-level namespaces): `init.*`, `list.*`, `verify.*`, `progress.*`, `errors.*`, `common.*`.

Example bilingual keys (dogfooding sample, ~5 per area):
```json
// es.json
{
  "init.intro": " ai-dev-bootcamp · init ",
  "init.key_prompt": "Pegá tu API key de Anthropic (empieza con sk-ant-)",
  "init.locale_prompt": "Elegí el idioma para la CLI y los ejercicios",
  "init.saved": "Guardado en {path}. Siguiente: {nextCmd}",
  "list.empty": "No se encontraron ejercicios.",
  "list.hint": "Ejecutá los tests de un ejercicio: aidev verify <id>",
  "verify.running": "→ {id} contra {target}.ts",
  "verify.exercise_doc": "→ Ejercicio: {path}",
  "verify.progress_saved": "✓ Progreso guardado para {id}.",
  "verify.not_found": "Ejercicio '{id}' no encontrado. Probá: aidev list",
  "verify.no_key": "No se encontró API key de Anthropic.",
  "verify.no_key_hint": "  Corré 'aidev init' o exportá ANTHROPIC_API_KEY.",
  "progress.total": "Total: {done}/{total} ejercicios completados.",
  "errors.unsupported_locale": "Locale no soportado \"{value}\". Soportados: {list}",
  "errors.locale_fallback": "Ejercicio {id}: no hay contenido \"{requested}\"; mostrando \"es\".",
  "common.stale": " ⚠ desactualizado"
}
// en.json
{
  "init.intro": " ai-dev-bootcamp · init ",
  "init.key_prompt": "Paste your Anthropic API key (starts with sk-ant-)",
  "init.locale_prompt": "Choose the language for the CLI and exercises",
  "init.saved": "Saved to {path}. Next: {nextCmd}",
  "list.empty": "No exercises found.",
  "list.hint": "Run an exercise's tests: aidev verify <id>",
  "verify.running": "→ {id} against {target}.ts",
  "verify.exercise_doc": "→ Exercise: {path}",
  "verify.progress_saved": "✓ Progress saved for {id}.",
  "verify.not_found": "Exercise '{id}' not found. Try: aidev list",
  "verify.no_key": "No Anthropic API key found.",
  "verify.no_key_hint": "  Run 'aidev init' to configure, or export ANTHROPIC_API_KEY.",
  "progress.total": "Total: {done}/{total} exercises completed.",
  "errors.unsupported_locale": "Unsupported locale \"{value}\". Supported: {list}",
  "errors.locale_fallback": "Exercise {id}: no \"{requested}\" content; showing \"es\".",
  "common.stale": " ⚠ stale"
}
```

Interpolation: single-pass `template.replace(/\{(\w+)\}/g, (_, k) => vars?.[k] ?? "")`. Missing var → empty string IF vars provided; if `vars` is undefined entirely, the placeholder is left intact (per spec scenario "wrong key" — allows debugging drift). Unknown key returns the key literal unchanged.

## 5. Wiring: commander integration

Pattern — root-level `.option` + `.hook("preAction")`. Each sub-command also declares `--locale` (so `aidev verify 01-first-call --locale en` parses correctly and shows up in `--help`). The preAction reads the innermost command's opts first, falling back to `program.opts()`. This covers both `aidev --locale en list` and `aidev list --locale en`.

Code sketch (no implementation):
```ts
// index.ts
program
  .name("aidev")
  .option("--locale <code>", "Locale override (es|en)")
  .hook("preAction", async (thisCommand, actionCommand) => {
    const flag = actionCommand.opts().locale ?? thisCommand.opts().locale;
    const locale = await resolveLocale(flag);   // may process.exit(1)
    initI18n(locale);
  });
// each command:
new Command("list").option("--locale <code>", "Locale override (es|en)").action(...)
```

## 6. Config changes (`packages/cli/src/config.ts`)

- `Config` gains `locale?: SupportedLocale` (optional — older configs still load).
- New export `resolveLocale(flagValue?: string): Promise<SupportedLocale>` mirrors `resolveApiKey()`:
  1. If `flagValue` present → validate → return (or exit 1).
  2. If `process.env.AIDEV_LOCALE` → validate → return (or exit 1).
  3. `readConfig().locale` → validate → return (invalid stored value also exits 1, surfaces corruption).
  4. Default `"es"`.
- `validateLocale(value: string): SupportedLocale` — throws-via-exit with message `Unsupported locale "{value}". Supported: es, en` (printed directly, NOT through `t()` — i18n module may not be initialized yet).
- `aidev init` flow: after successful API key save, clack `select` with `[{value: "es", label: "Español"}, {value: "en", label: "English"}]`, then `writeConfig({...existing, anthropicApiKey, locale})`. Existing-locale overwrite prompt mirrors existing-key overwrite pattern.

## 7. Exercise changes (`packages/cli/src/exercises.ts`)

- `ExerciseMeta.locales: SupportedLocale[]` — REQUIRED. No optional `?`.
- `Exercise` gains no new field; content path is resolved on demand via helper.
- `listExercises()` validates each exercise:
  - Missing `locales` field → warn `Exercise {id}: meta.json missing required "locales" field` and EXCLUDE from results.
  - Unsupported value in `locales` → warn + exclude.
  - Each declared locale without the corresponding `<locale>/exercise.md` → warn once (dedup by `Set<string>` keyed `${id}:${locale}`) but KEEP the exercise visible (partial availability, not hidden — per spec).
  - A module-level `warnedMissingContent: Set<string>` lives for process lifetime.
- `findExercise(id)` — unchanged (still uses `listExercises`; reuses the same Set so no double-warn).
- New `exerciseDocPath(exercise: Exercise, locale: SupportedLocale): string`:
  1. `candidate = join(exercise.dir, locale, "exercise.md")`; if exists → return.
  2. Else if `locale !== "es"` → emit `errors.locale_fallback` via `t()` to stderr (once per `${id}:${locale}` key; reuses discovery Set to prevent double-warn), return `join(exercise.dir, "es", "exercise.md")`.
  3. Else → throw `Exercise {id}: es/exercise.md is missing` (critical).
- File existence check: `existsSync` from `node:fs` — preferred, lower overhead than stat.

## 8. Migration of `01-first-call`

- `git mv exercise.md es/exercise.md` (no content change).
- New `en/exercise.md` — parallel translation. Canonical URLs unchanged. Matches 6 required sections.
- `meta.json` gains `"locales": ["es", "en"]` (last field, before closing brace).
- `starter.ts`, `solution.ts`, `tests.test.ts` — UNCHANGED.

## 9. Tests plan (Strict TDD: apply phase writes tests FIRST)

| Layer | Target | How |
|-------|--------|-----|
| Unit | `i18n/index.ts` — `t()` key lookup (es + en), `{var}` interpolation, unknown key returns literal, unknown locale file throws at `initI18n`, no cross-locale fallback | `bun test` pure — no spawn |
| Unit | `config.ts` — `resolveLocale()` precedence (flag > env > config > default), invalid value exits | `bun test` + `process.env` stubbing + `process.exit` mock |
| Unit | `exercises.ts` — `exerciseDocPath` returns requested locale, falls back to es silently at runtime, throws if es missing | `bun test` with `tmpdir` fixture exercise trees |
| Unit | `exercises.ts` — `listExercises()` warns once per missing declared locale, emits `meta.json missing locales` warning and excludes | `bun test` + stderr capture + fixture exercises |
| Integration | `aidev list --locale en` → stdout contains EN `list.hint` string | `spawn("bun", ["run", "src/index.ts", "list", "--locale", "en"])` + assert |
| Integration | `aidev list --locale fr` → exit 1, stderr `Unsupported locale "fr"...` | spawn + exit code assertion |
| Integration | `aidev verify 01-first-call --solution` still passes post-migration | spawn (guard `ANTHROPIC_API_KEY`) |
| Integration | `aidev init` locale prompt writes `locale` to config | clack test harness OR skip interactive, unit-test the config write helper |

## 10. Files to create / modify

| Path | Action | Notes |
|------|--------|-------|
| `code/packages/cli/src/i18n/index.ts` | CREATE | Public API + interpolation |
| `code/packages/cli/src/i18n/types.ts` | CREATE | `SupportedLocale`, `SUPPORTED_LOCALES` |
| `code/packages/cli/src/i18n/es.json` | CREATE | Spanish dict |
| `code/packages/cli/src/i18n/en.json` | CREATE | English dict |
| `code/packages/cli/src/index.ts` | MODIFY | Add `--locale` root option + preAction hook |
| `code/packages/cli/src/commands/init.ts` | MODIFY | Locale clack select + t() strings |
| `code/packages/cli/src/commands/list.ts` | MODIFY | `--locale` option + t() strings |
| `code/packages/cli/src/commands/verify.ts` | MODIFY | `--locale` option + t() + print exerciseDocPath |
| `code/packages/cli/src/commands/progress.ts` | MODIFY | `--locale` option + t() strings |
| `code/packages/cli/src/config.ts` | MODIFY | `locale?` field, `resolveLocale`, `validateLocale` |
| `code/packages/cli/src/exercises.ts` | MODIFY | `locales` required in meta, discovery warnings + dedup Set, `exerciseDocPath` |
| `code/packages/cli/tsconfig.json` | VERIFY | `resolveJsonModule: true` present (add if not) |
| `code/packages/cli/src/i18n/i18n.test.ts` | CREATE | Unit tests |
| `code/packages/cli/src/config.test.ts` | CREATE | `resolveLocale` tests |
| `code/packages/cli/src/exercises.test.ts` | CREATE | discovery + `exerciseDocPath` tests |
| `code/packages/cli/src/commands/cli.integration.test.ts` | CREATE | spawn-based integration tests |
| `code/packages/exercises/01-foundations/01-first-call/exercise.md` | DELETE | moved via git mv |
| `code/packages/exercises/01-foundations/01-first-call/es/exercise.md` | CREATE | moved content (unchanged) |
| `code/packages/exercises/01-foundations/01-first-call/en/exercise.md` | CREATE | English parallel translation |
| `code/packages/exercises/01-foundations/01-first-call/meta.json` | MODIFY | Add `"locales": ["es","en"]` |
| `docs/EXERCISE-CONTRACT.md` | MODIFY | Locale subdirs + `meta.locales` (scope — in proposal) |

## 11. Architecture Decision Records

### ADR-1: `--locale` wiring → Option B (per-command `.option`) + root `.option` + `preAction` hook (hybrid)
Chosen: declare `--locale` on the root `program` AND on each subcommand; `preAction` reads `actionCommand.opts().locale ?? program.opts().locale`. Rejected: (A) pure root-only — commander puts unknown options AFTER the subcommand into an error; (C) module singleton resolved in preAction alone is fine but without per-command `.option` declarations, `aidev list --locale en` fails to parse. Rationale: commander has no native "global option with per-command override"; declaring on both ends delivers the UX users expect (either position works) AND centralizes resolution in the hook. Trade-off: minor repetition (4 `.option` lines) — acceptable for 4 commands.

### ADR-2: Resolution timing → resolve ONCE in preAction, store in module-level singleton inside `i18n/index.ts`
Chosen: `initI18n(locale)` sets a mutable module-level `activeLocale` and `activeDict`. `t()` reads both synchronously. Rejected: lazy per-`t()` resolution (spec-violating — would re-read env/config each call, slow, and `t()` can't be async). Rejected: pass locale through every command action (ceremony noise; 10+ call sites). Rationale: CLI process is short-lived; a singleton is the right shape. Guard: if `t()` is called before `initI18n()`, throw with a clear error — this is a programmer bug, fail fast. No `t()` calls occur before preAction because preAction runs before any action.

### ADR-3: Dictionary load strategy → static imports with `resolveJsonModule`
Chosen: `import es from "./es.json" with { type: "json" }` (or `resolveJsonModule: true`). Rejected: dynamic `import()` / `readFile`. Rationale: TypeScript validates JSON presence at typecheck time — a missing file fails `bunx tsc --noEmit` loudly. Zero async bootstrap, smaller surface, no packaging footguns. Spec requires throw-at-module-load for missing files; static import delivers this for free. Trade-off: dictionaries are bundled; at ~200 bytes each, irrelevant.

### ADR-4: Warning dedup → single module-level `Set<string>` in `exercises.ts` keyed `${id}:${locale}`
Chosen: discovery (`listExercises`) and runtime (`exerciseDocPath`) share the Set. First site to encounter the missing content warns; the other stays silent. Rejected: (i) discovery-only warning + silent runtime fallback — fails the spec scenario "verify should warn before running tests when falling back"; (ii) both warn without dedup — noisy for `aidev verify` invoked repeatedly in one process (rare but possible). Rationale: the spec explicitly wants verify to warn AND wants no log noise; a shared Set satisfies both because a given (id, locale) warns at most once per process. Process boundary is fine — every new `aidev` invocation re-warns (desired, it's surfacing a drift state).

### ADR-5: Type location → `SupportedLocale` lives in `packages/cli/src/i18n/types.ts`; NOT re-exported from `@aidev/runner`
Chosen: CLI-only. Rejected: sharing via runner (runner is the test harness; it has no opinion on locale, exercises declare `locales` in JSON meta which is string-validated at load time by `exercises.ts`). Rationale: YAGNI — zero runner code needs the type today. If a future exercise test genuinely needs `SupportedLocale`, we export it then. `Config.locale` imports from `./i18n/types.ts`; `ExerciseMeta.locales: SupportedLocale[]` imports from `./i18n/types.ts`.

## 12. Risks + mitigations (carried + new)

| Risk | Src | Likelihood | Mitigation |
|------|-----|-----------|------------|
| Contributors add es only; en stays stub | Spec | High | Discovery warning surfaces missing declared locales; review checklist |
| `t()` over-engineered | Spec | Low (bounded here) | API capped at 3 functions; static imports; no deps |
| `--locale xx` confuses users | Spec | Med | Exit code 1 + explicit supported-list message, printed without i18n |
| Migration breaks 01-first-call tests | Spec | Low | Integration test runs `aidev verify 01-first-call --solution` post-migration |
| preAction fires for `--help`/`--version` and explodes | NEW (design) | Med | commander DOES NOT call preAction for `--help`/`--version`; confirmed by commander docs. No action needed, but a smoke test asserts `aidev --help` prints help and exits 0 |
| `t()` called before `initI18n` in a future code path | NEW (design) | Low | Throw with explicit programmer-error message if `activeDict` is null; add unit test |
| Invalid locale stored in config.json (corruption/old value) | NEW (design) | Low | `resolveLocale` validates the config value and exits 1 with actionable message (`run aidev init`) |
| Duplicate `.option("--locale")` across commands drifts in help text | NEW (design) | Low | Centralize the option definition: `function localeOption(cmd) { return cmd.option("--locale <code>", t("common.locale_option_desc")) }` — but note desc is read at option-add time BEFORE initI18n runs, so use a plain English literal for the help text, not `t()` |
