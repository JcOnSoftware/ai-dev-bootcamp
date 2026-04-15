# Delta for cli-commands

## MODIFIED Requirements

### Requirement: `aidev init` — locale prompt

`aidev init` MUST prompt the user to select a locale (using clack `select`) immediately after saving the API key. The selected locale MUST be persisted to `~/.aidev/config.json` under the `"locale"` field. If a locale is already stored, `aidev init` MUST show the current value and ask whether to overwrite, consistent with the existing API key overwrite pattern.
(Previously: `aidev init` only prompted for API key and did not handle locale.)

#### Scenario: First-time init — locale prompt shown

- GIVEN `~/.aidev/config.json` does not exist or has no `locale` field
- WHEN the user runs `aidev init` and provides a valid API key
- THEN a clack select prompt is shown with options: `es` and `en`
- AND the selected locale is written to `config.json` under `"locale"`
- AND the outro message confirms both the key and locale were saved

#### Scenario: Existing locale — overwrite prompt

- GIVEN `~/.aidev/config.json` already contains `"locale": "es"`
- WHEN the user runs `aidev init`
- THEN `aidev init` shows the current locale and asks to overwrite it
- AND if the user selects "No", the existing locale is preserved

#### Scenario: User cancels locale selection

- GIVEN the locale select prompt is shown
- WHEN the user cancels (Ctrl+C or clack cancel signal)
- THEN `p.cancel()` is called with an appropriate message
- AND the command exits cleanly (no crash, no partial write)

---

### Requirement: `aidev list` — locale-aware output

`aidev list` MUST use `t()` for all user-facing strings. The active locale MUST be resolved once before rendering and passed to string lookups. Output content does not change per locale, but all hard-coded English/Spanish strings MUST be replaced with `t()` calls.
(Previously: `aidev list` used hard-coded strings, no locale awareness.)

`aidev list` MUST accept a `--locale <value>` option that overrides the resolved locale for that invocation.

#### Scenario: List with active locale es

- GIVEN the resolved locale is `"es"`
- WHEN the user runs `aidev list`
- THEN the "no exercises" message and footer hint use strings from `es.json`

#### Scenario: List overridden via --locale flag

- GIVEN the config locale is `"es"`
- AND the user runs `aidev list --locale en`
- THEN all `t()` calls use `en.json` strings for that invocation

#### Scenario: --locale with unsupported value

- GIVEN the user runs `aidev list --locale fr`
- WHEN locale is resolved
- THEN the process exits with code 1 and prints: `Unsupported locale "fr". Supported: es, en`

---

### Requirement: `aidev verify` — locale-aware output and exercise.md path

`aidev verify` MUST use `t()` for all user-facing output strings. It MUST also print the resolved path to the active locale's `exercise.md` so the learner knows which file to open.
(Previously: `aidev verify` used hard-coded strings and pointed to `tests.test.ts` only.)

`aidev verify` MUST accept a `--locale <value>` option that overrides the resolved locale for that invocation.

#### Scenario: Verify shows locale-scoped exercise.md path

- GIVEN active locale is `"en"` and exercise `01-first-call` has `en/exercise.md`
- WHEN the user runs `aidev verify 01-first-call`
- THEN the output includes a line such as: `→ Exercise: <absolute-path>/en/exercise.md`
- AND test execution proceeds normally

#### Scenario: Verify with locale fallback — warns before running tests

- GIVEN active locale is `"en"` but `01-first-call` only has `es/exercise.md`
- WHEN the user runs `aidev verify 01-first-call`
- THEN a warning is printed: `Exercise 01-first-call: no "en" content; showing "es".`
- AND the `es/exercise.md` path is printed
- AND tests run normally (locale mismatch does not block verification)

#### Scenario: Verify unknown exercise — error unchanged

- GIVEN the user runs `aidev verify unknown-id`
- WHEN the exercise is not found
- THEN the error message is rendered via `t()` but semantics are unchanged: exit code 1

## ADDED Requirements

### Requirement: `--locale` global option

All commands (`init`, `list`, `verify`) MUST accept `--locale <value>` as a per-invocation override. Unknown values MUST exit with code 1 listing supported locales. This is not a persistent change — it applies only to the current process invocation.

#### Scenario: --locale overrides config for single invocation

- GIVEN `config.json` has `"locale": "es"`
- AND user runs `aidev verify 01-first-call --locale en`
- THEN the active locale for that run is `"en"`, config is unchanged after

#### Scenario: --locale unknown value — immediate exit

- GIVEN user runs any command with `--locale zz`
- WHEN locale resolution validates the value
- THEN process exits code 1: `Unsupported locale "zz". Supported: es, en`
