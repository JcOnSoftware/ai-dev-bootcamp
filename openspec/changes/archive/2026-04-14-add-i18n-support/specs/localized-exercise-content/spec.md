# localized-exercise-content Specification

## Purpose

Per-locale exercise content layout and validation. Replaces the single `exercise.md` at exercise root with per-locale subdirectories. Adds locale awareness to `meta.json` and the exercise path resolver.

## Requirements

### Requirement: Locale Subdirectory Layout

Exercise content files MUST be organized as `<exercise>/<locale>/exercise.md`. The root-level `exercise.md` MUST NOT exist after migration. All other exercise files (`starter.ts`, `solution.ts`, `tests.test.ts`, `meta.json`) remain at exercise root — they are locale-neutral.

#### Scenario: Resolving exercise.md for the active locale

- GIVEN exercise `01-first-call` has both `es/exercise.md` and `en/exercise.md`
- AND the active locale is `"en"`
- WHEN `exerciseDocPath("01-first-call", "en")` is called
- THEN the returned path is `<exercise-root>/en/exercise.md`

---

### Requirement: `meta.json` locales field

`meta.json` MUST declare a `"locales"` field: an array of locale strings. At least `"es"` MUST be present. The field MUST NOT be absent or empty.

**Decision — `meta.json` missing `locales`**: Treated as a contract violation. The CLI MUST reject the exercise during discovery (not at verify time). Rationale: an exercise without a declared locale list is ambiguous — the runtime cannot know which subdirs are authoritative vs. accidental.

**Decision — declared locale with missing file**: If `meta.locales` declares `"en"` but `en/exercise.md` is absent, it is a contract violation. The CLI MUST report the missing file at exercise discovery/validation time, NOT silently skip it at `t()` time. Rationale: contributors who declare a locale are committing to providing the content.

#### Scenario: meta.json missing locales field — rejected at discovery

- GIVEN an exercise whose `meta.json` has no `"locales"` field
- WHEN `listExercises()` or `findExercise()` processes that exercise
- THEN the exercise is excluded from results with a warning message identifying the exercise id
- AND no crash occurs for other valid exercises

#### Scenario: Declared locale file missing — contract violation at discovery

- GIVEN `meta.json` declares `"locales": ["es", "en"]`
- AND `en/exercise.md` does not exist
- WHEN the exercise is discovered or validated
- THEN a warning is emitted: `Exercise <id>: declared locale "en" but en/exercise.md is missing`
- AND the exercise is still listed (not hidden) because `es` is valid — partial availability is surfaced, not hidden

---

### Requirement: Locale Fallback for Exercise Content

**Decision — content fallback**: When the active locale is NOT `"es"` (e.g., `"en"`) and the locale's `exercise.md` is absent (despite being declared, which is a contract violation per the requirement above), the CLI MUST fall back to `"es"` with a visible warning. Rationale: for end-users at runtime, crashing the verify command because a translator didn't finish `en/exercise.md` is worse than showing the Spanish version with a clear notice.

Note: the `exerciseDocPath` helper MUST handle this fallback; the missing-at-declaration-time warning is emitted during discovery (separate requirement above).

#### Scenario: Active locale en, es-only exercise — fallback with warning

- GIVEN exercise `02-params` has only `es/exercise.md` (meta declares only `["es"]`)
- AND the active locale is `"en"`
- WHEN `exerciseDocPath("02-params", "en")` is called
- THEN the returned path is `<exercise-root>/es/exercise.md`
- AND a warning is printed: `Exercise 02-params: no "en" content; showing "es".`

#### Scenario: Active locale es — no fallback needed

- GIVEN the active locale is `"es"`
- AND `es/exercise.md` exists
- WHEN `exerciseDocPath(exercise, "es")` is called
- THEN the returned path is `<exercise-root>/es/exercise.md` (no warning)

---

### Requirement: `exerciseDocPath` Helper

A helper `exerciseDocPath(exercise: ExerciseMeta, locale: string): string` MUST be added to `packages/cli/src/exercises.ts`. It MUST:

1. Attempt to resolve `<exercise-root>/<locale>/exercise.md`.
2. If the locale-specific file does not exist and locale is not `"es"`, fall back to `es/exercise.md` with a stderr warning.
3. If `es/exercise.md` also does not exist, throw an error — the exercise is critically malformed.

#### Scenario: Both locales present — returns requested locale path

- GIVEN `es/exercise.md` and `en/exercise.md` both exist
- AND active locale is `"en"`
- WHEN `exerciseDocPath(exercise, "en")` is called
- THEN path points to `en/exercise.md`, no warning emitted
