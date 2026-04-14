# Exercise contract

Every exercise in `code/packages/exercises/<track>/<id>/` MUST follow this contract. Contributors: if your PR doesn't meet this, it won't merge.

## Required files

Each exercise directory contains exactly these five files:

| File | Purpose |
|---|---|
| `exercise.md` | The learner-facing problem statement. Required sections below. |
| `starter.ts` | TODO-template code the learner edits. Throws by default. |
| `solution.ts` | Working reference implementation. Identical shape to starter. |
| `tests.test.ts` | Assertions run by `aidev verify`. Uses `@aidev/runner`. |
| `meta.json` | Machine-readable metadata (see schema). |

The `.test.ts` suffix is required — Bun's test discovery depends on it.

## `exercise.md` required sections

In this exact order. Missing a section blocks merge.

1. **`# Exercise <NN> — <title>`** — H1 title matching `meta.json` `title`.
2. **`## Concept`** — What the learner needs to understand BEFORE touching code. 2-4 short paragraphs. No code required here.
3. **`## Docs & references`** — Official links only, numbered, with a one-line summary of what each link answers. URLs must resolve (canonical, not redirects). No third-party blog posts or YouTube videos in v1.
4. **`## Tu tarea`** — Step-by-step of what the learner must implement in `starter.ts`.
5. **`## Cómo verificar`** — The `aidev verify <id>` command + a bullet list of what the tests check.
6. **`## Concepto extra (opcional)`** — Optional deepening. Nothing the tests rely on.

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
  "model_cost_hint": "<optional: '~$X per verify run (Haiku)'>"
}
```

Rules:
- `id` MUST equal the directory name.
- `track` MUST equal the parent directory name.
- `valid_until` default: 6 months from creation. The weekly CI health check warns when this approaches.
- Bump `version` major when the concept being taught changes — this resets learner progress for that exercise.

## Cost discipline

- Default model in solutions: Haiku. If an exercise MUST use Sonnet/Opus, justify in `meta.json.model_cost_hint`.
- Total v1 bootcamp should stay under ~$2 to complete end-to-end for a learner.

## Review checklist (for contributors)

Before opening a PR:

- [ ] All 5 files present, correctly named.
- [ ] `exercise.md` has all 6 required sections in order.
- [ ] `starter.ts` has the Docs comment header.
- [ ] All doc URLs resolve and are canonical (no redirects).
- [ ] `aidev verify <id>` fails on `starter.ts` with a clean error.
- [ ] `AIDEV_TARGET=solution aidev verify <id>` passes all tests.
- [ ] `bunx tsc --noEmit` passes from `code/`.
- [ ] `meta.json.id` matches directory; `meta.json.track` matches parent.
