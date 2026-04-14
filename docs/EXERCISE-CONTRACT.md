# Exercise contract

Every exercise in `code/packages/exercises/<track>/<id>/` MUST follow this contract. Contributors: if your PR doesn't meet this, it won't merge.

## Required files

Each exercise directory contains exactly these files:

| Path | Purpose |
|---|---|
| `<locale>/exercise.md` | Locale-scoped learner-facing problem statement. At minimum `es/exercise.md` MUST exist. Each declared locale gets its own subdir. |
| `starter.ts` | TODO-template code the learner edits. Throws by default. Locale-neutral. |
| `solution.ts` | Working reference implementation. Identical shape to starter. Locale-neutral. |
| `tests.test.ts` | Assertions run by `aidev verify`. Uses `@aidev/runner`. |
| `meta.json` | Machine-readable metadata (see schema). |

Example directory layout:

```
01-first-call/
├── es/
│   └── exercise.md        ← Spanish problem statement (required)
├── en/
│   └── exercise.md        ← English problem statement (required before public flip)
├── starter.ts
├── solution.ts
├── tests.test.ts
└── meta.json
```

Root-level `exercise.md` MUST NOT exist. Any exercise with a root-level `exercise.md` is treated as non-migrated and will be rejected in CI.

The `.test.ts` suffix is required — Bun's test discovery depends on it.

## `exercise.md` required sections

Each `<locale>/exercise.md` MUST contain all 6 sections in this exact order. Missing a section blocks merge. Translations may use the locale's natural phrasing for headings — English equivalents are noted below.

1. **`# Exercise <NN> — <title>`** — H1 title matching `meta.json` `title`.
2. **`## Concept`** (es: `## Concepto`) — What the learner needs to understand BEFORE touching code. 2-4 short paragraphs. No code required here.
3. **`## Docs & references`** (es: `## Docs & referencias`) — Official links only, numbered, with a one-line summary of what each link answers. URLs must resolve (canonical, not redirects). No third-party blog posts or YouTube videos in v1.
4. **`## Tu tarea`** (en: `## Your task`) — Step-by-step of what the learner must implement in `starter.ts`.
5. **`## Cómo verificar`** (en: `## How to verify`) — The `aidev verify <id>` command + a bullet list of what the tests check.
6. **`## Concepto extra (opcional)`** (en: `## Extra concept (optional)`) — Optional deepening. Nothing the tests rely on.

Section order MUST be preserved across all locales. Heading text may be translated; heading semantics (what each section is for) MUST NOT change.

## `starter.ts` requirements

- First non-empty lines: a comment block linking to the same official docs referenced in `exercise.md`. Format:
  ```ts
  // Docs:
  //   SDK README  : <url>
  //   API ref     : <url>
  //   Model IDs   : <url>
  ```
  Rationale: the learner edits the file in an IDE — doc links must be visible without switching tabs.
- Must export `default async function run(): Promise<Message>` (or the return type relevant to the exercise).
- Default body: `throw new Error("TODO: ...")` pointing the learner back to `exercise.md`.

## `solution.ts` requirements

- Same signature as `starter.ts`.
- Idiomatic, minimal working implementation. No clever tricks — this is the reference the learner will peek at when they give up.
- Must pass all assertions in `tests.test.ts` when run with `AIDEV_TARGET=solution`.

## `tests.test.ts` requirements

- Imports from `@aidev/runner`.
- Uses `resolveExerciseFile(import.meta.url)` — never hardcode `./starter.ts`.
- Guards on `ANTHROPIC_API_KEY` in `beforeAll`, throwing a helpful error if missing.
- Assertions should target STRUCTURE (model used, tools, max_tokens, shape of response) over CONTENT (literal text). LLM output is non-deterministic.
- Prefer `toMatch(/regex/)` and `Array.find(predicate)` over exact-match assertions.

## `meta.json` schema

```json
{
  "id": "<kebab-case id matching directory name>",
  "track": "<track slug, e.g. 01-foundations>",
  "title": "<human-readable title matching exercise.md H1>",
  "version": "<semver>",
  "valid_until": "<ISO date — when content may need review>",
  "concepts": ["<tag>", "<tag>"],
  "estimated_minutes": <integer>,
  "requires": ["<other exercise id>"],
  "model_cost_hint": "<optional: '~$X per verify run (Haiku)'>",
  "locales": ["es"]
}
```

Rules:
- `id` MUST equal the directory name.
- `track` MUST equal the parent directory name.
- `valid_until` default: 6 months from creation. The weekly CI health check warns when this approaches.
- Bump `version` major when the concept being taught changes — this resets learner progress for that exercise.
- `locales` is **required**. Must be a non-empty array containing at minimum `"es"`. Supported values: `"es"`, `"en"`. Any other value is a contract violation.
- Each value in `locales` MUST correspond to an existing `<locale>/exercise.md` file, and vice-versa: every `<locale>/` subdir MUST be declared in `locales`. Mismatches cause `aidev` discovery warnings and may exclude the exercise.
- `"en"` is required before the repo flips to public.

## Cost discipline

- Default model in solutions: Haiku. If an exercise MUST use Sonnet/Opus, justify in `meta.json.model_cost_hint`.
- Total v1 bootcamp should stay under ~$2 to complete end-to-end for a learner.

## Review checklist (for contributors)

Before opening a PR:

- [ ] `starter.ts`, `solution.ts`, `tests.test.ts`, `meta.json` present at exercise root.
- [ ] `meta.json.locales` declares every present `<locale>/` subdir, and vice-versa (no undeclared dirs, no declared-but-missing dirs).
- [ ] Every declared locale has a complete `<locale>/exercise.md` with all 6 required sections in order.
- [ ] `es/exercise.md` is present and complete (mandatory for every exercise).
- [ ] `starter.ts` has the Docs comment header.
- [ ] All doc URLs in every locale's `exercise.md` resolve and are canonical (no redirects).
- [ ] `aidev verify <id>` fails on `starter.ts` with a clean error.
- [ ] `AIDEV_TARGET=solution aidev verify <id>` passes all tests.
- [ ] `bunx tsc --noEmit` passes from `code/`.
- [ ] `meta.json.id` matches directory; `meta.json.track` matches parent.
