# Delta for exercise-contract

## MODIFIED Requirements

### Requirement: Exercise directory structure — locale subdirs

Each exercise directory MUST contain exactly these files and subdirectories:

| Path | Purpose |
|------|---------|
| `<locale>/exercise.md` | Locale-scoped learner-facing problem statement. At least `es/` MUST exist. |
| `starter.ts` | TODO-template code (locale-neutral). |
| `solution.ts` | Reference implementation (locale-neutral). |
| `tests.test.ts` | Assertions run by `aidev verify`. |
| `meta.json` | Machine-readable metadata (updated schema — see below). |

Root-level `exercise.md` MUST NOT exist. Any exercise with a root-level `exercise.md` MUST be treated as non-migrated and rejected in CI.

(Previously: `exercise.md` lived at exercise root. No locale subdirectory was required.)

#### Scenario: Valid exercise with both locales

- GIVEN an exercise has `es/exercise.md`, `en/exercise.md`, and valid `meta.json` with `"locales": ["es","en"]`
- WHEN the contract is validated (CI or aidev discover)
- THEN the exercise passes validation

#### Scenario: Exercise missing es/ — contract violation

- GIVEN an exercise has only `en/exercise.md` and no `es/exercise.md`
- AND `meta.json` declares `"locales": ["en"]`
- WHEN the contract is validated
- THEN validation fails with: `Exercise <id>: "es" locale is required but es/exercise.md is missing`

#### Scenario: Root-level exercise.md present — contract violation

- GIVEN an exercise has a root-level `exercise.md` (pre-migration)
- WHEN the contract is validated
- THEN validation fails with: `Exercise <id>: root-level exercise.md found; migrate to es/exercise.md`

---

### Requirement: `meta.json` schema — locales field

`meta.json` MUST include a `"locales"` field: a non-empty array of locale strings. At minimum it MUST contain `"es"`. Each value in `locales` MUST correspond to an existing `<locale>/exercise.md` file. Values outside supported locales (`es`, `en`) MUST cause a validation error.
(Previously: `meta.json` had no `locales` field.)

Updated schema:

```json
{
  "id": "<kebab-case>",
  "track": "<track-slug>",
  "title": "<human-readable title>",
  "version": "<semver>",
  "valid_until": "<ISO date>",
  "concepts": ["<tag>"],
  "estimated_minutes": 0,
  "requires": [],
  "model_cost_hint": "<optional>",
  "locales": ["es"]
}
```

#### Scenario: meta.json without locales — rejected

- GIVEN `meta.json` has no `"locales"` field
- WHEN exercise is discovered
- THEN it is excluded with warning: `Exercise <id>: meta.json missing required "locales" field`

#### Scenario: Locales field with unsupported locale — rejected

- GIVEN `meta.json` declares `"locales": ["es", "pt"]`
- WHEN exercise is validated
- THEN validation fails: `Exercise <id>: unsupported locale "pt" in locales. Supported: es, en`

---

### Requirement: `starter.ts` and `solution.ts` — unchanged, locale-neutral

`starter.ts` and `solution.ts` MUST remain at exercise root. They are locale-neutral (code + canonical doc URLs only). The `// Docs:` comment header in `starter.ts` stays unchanged — URLs are canonical and language-independent.
(No behavior change — this requirement is made explicit to prevent misinterpretation of the locale subdir rule.)

#### Scenario: Correct placement — starter.ts at root

- GIVEN an exercise has `starter.ts` at exercise root and `es/exercise.md` in locale subdir
- WHEN validated
- THEN both files are accepted; no warning about locale subdirectory for `.ts` files

## ADDED Requirements

### Requirement: Review checklist — locale completeness

The contributor review checklist MUST include a locale completeness check:

- [ ] All locales declared in `meta.json` `"locales"` have a complete `exercise.md` with all 6 required sections.
- [ ] `es/exercise.md` is present and complete (mandatory for every exercise).

#### Scenario: PR with incomplete en/exercise.md — blocked by checklist

- GIVEN a PR adds an exercise with `meta.json` declaring `"locales": ["es","en"]`
- AND `en/exercise.md` exists but is missing the `## Tu tarea` section
- WHEN the reviewer checks the checklist
- THEN the "All declared locales have a complete exercise.md" item is unchecked
- AND the PR MUST NOT merge until corrected
