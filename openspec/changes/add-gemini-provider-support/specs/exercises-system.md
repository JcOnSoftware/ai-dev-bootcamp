# Spec: Exercises system extension (Gemini)

Delta spec — 30 new exercises under `packages/exercises/gemini/`.

## Requirements

### R1 — Six tracks exist

**Scenarios:**
- GIVEN `packages/exercises/gemini/` is read THEN these six directories exist with the listed exercises:
  - `01-foundations/` (5 exercises)
  - `02-context-caching/` (5)
  - `03-function-calling/` (5)
  - `04-rag/` (5)
  - `05-agents/` (5)
  - `06-live-multimodal/` (5)

### R2 — Each exercise follows EXERCISE-CONTRACT.md

**Scenarios:**
- GIVEN any Gemini exercise directory THEN it contains: `meta.json`, `starter.ts`, `solution.ts`, `tests.test.ts`, `en/exercise.md`, `es/exercise.md`.
- GIVEN `meta.json` THEN it declares `provider: "gemini"`, `track`, `version`, `valid_until`, `concepts`, `estimated_minutes`, `locales: ["en","es"]`.
- GIVEN `starter.ts` THEN the first line is a `// Docs: ...` comment with a canonical URL from `ai.google.dev/gemini-api/docs` or `googleapis.github.io/js-genai`.

### R3 — Default model stays cheap

**Scenarios:**
- GIVEN any Gemini `solution.ts` (excluding track 06 Live API) THEN it uses `gemini-2.5-flash-lite` unless a higher-tier model is specifically needed for the concept.
- GIVEN the whole Gemini bootcamp is run end-to-end THEN total spend is below $0.10 USD.

### R4 — Tests are structural, not literal

**Scenarios:**
- GIVEN any `tests.test.ts` THEN it asserts on captured-call structure (model name, presence of tools, parameter shape) and NOT on specific LLM text output.
- GIVEN `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY` missing THEN tests skip or `beforeAll` throws clearly.

## Fallback

If B0 spike reveals Live API interception is infeasible:
- Drop track `06-live-multimodal` (5 exercises) from v3.0 scope.
- Document deferral to v3.1 in PR description.
- v3.0 ships with 25 Gemini exercises.
