> Authoritative spec — last updated from archived change `add-i18n-support` on `2026-04-14`. Historical deltas for this capability live under `openspec/changes/archive/2026-04-14-add-i18n-support/specs/i18n-runtime/spec.md`.

# i18n-runtime Specification

## Purpose

New module `packages/cli/src/i18n/` that provides locale resolution and translated string lookup (`t()`) for all CLI user-facing output. No external i18n library — ~50 LOC maximum.

## Requirements

### Requirement: Locale Resolution Chain

The runtime MUST resolve the active locale once at process start using this priority order (highest first):

1. `--locale <value>` CLI flag passed to any command
2. `AIDEV_LOCALE` environment variable
3. `locale` field in `~/.aidev/config.json`
4. Default: `"es"`

The resolved locale MUST be one of the supported values: `"es"` or `"en"`. Any other value MUST cause an immediate process exit with code 1 and an error message listing supported locales.

#### Scenario: Locale from CLI flag

- GIVEN the user runs `aidev list --locale en`
- WHEN locale resolution executes
- THEN the active locale is `"en"`
- AND all `t()` calls use the `en` dictionary for that invocation

#### Scenario: Locale from environment variable

- GIVEN `AIDEV_LOCALE=en` is set in the environment
- AND no `--locale` flag is present
- WHEN locale resolution executes
- THEN the active locale is `"en"`

#### Scenario: Locale from config file

- GIVEN `~/.aidev/config.json` contains `{ "locale": "en" }`
- AND neither `--locale` flag nor `AIDEV_LOCALE` env var is set
- WHEN locale resolution executes
- THEN the active locale is `"en"`

#### Scenario: Default locale fallback

- GIVEN no `--locale` flag, no `AIDEV_LOCALE` env var, and no `locale` in config
- WHEN locale resolution executes
- THEN the active locale is `"es"`

#### Scenario: Unknown locale via flag — exit with error

- GIVEN the user runs `aidev list --locale fr`
- WHEN locale resolution executes
- THEN the process exits with code 1
- AND the error message lists: `Unsupported locale "fr". Supported: es, en`

---

### Requirement: String Lookup via `t(key, vars?)`

The module MUST export a function `t(key: string, vars?: Record<string, string>): string` that returns the translated string for the active locale.

**Decision — missing key behavior**: Unknown keys MUST return the key literal unchanged (no crash).

**Decision — locale file load failure**: If the JSON file for the active locale cannot be loaded, the module MUST throw at initialization time (module load), NOT at `t()` call time.

**Decision — cross-locale fallback**: `t()` MUST NOT fall back to `"es"` when a key is missing in the active locale. It returns the key literal.

#### Scenario: Happy path — key present in active locale

- GIVEN the active locale is `"es"`
- AND `es.json` contains `{ "list.no_exercises": "No se encontraron ejercicios." }`
- WHEN `t("list.no_exercises")` is called
- THEN the return value is `"No se encontraron ejercicios."`

#### Scenario: Variable interpolation

- GIVEN the active locale is `"es"`
- AND `es.json` contains `{ "verify.running": "Verificando {id} contra {target}.ts" }`
- WHEN `t("verify.running", { id: "01-first-call", target: "starter" })` is called
- THEN the return value is `"Verificando 01-first-call contra starter.ts"`

#### Scenario: Key missing in active locale — returns key literal

- GIVEN the active locale is `"en"`
- AND `en.json` does NOT contain the key `"progress.header"`
- WHEN `t("progress.header")` is called
- THEN the return value is `"progress.header"` (no crash, no exception)

#### Scenario: Locale file missing — error at module load

- GIVEN the file `i18n/en.json` does not exist on disk
- WHEN the `i18n` module is imported
- THEN an error is thrown synchronously during module initialization
- AND the error message identifies the missing locale file path

#### Scenario: Variable placeholder not present in template

- GIVEN `es.json` contains `{ "hello": "Hola {name}" }`
- WHEN `t("hello", { greeting: "Buenos días" })` is called (wrong key)
- THEN the return value is `"Hola {name}"` (placeholder left as-is, no crash)
