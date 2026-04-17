# Spec: Provider system extension (Gemini)

Delta spec — changes on top of the current `SupportedProvider = "anthropic" | "openai"` capability.

## Requirements

### R1 — Third provider "gemini" is accepted everywhere a provider is validated

**Scenarios:**
- GIVEN `--provider gemini` flag WHEN any command runs THEN it is accepted without error.
- GIVEN `AIDEV_PROVIDER=gemini` env var WHEN any command runs THEN it is accepted.
- GIVEN config file `{ "provider": "gemini" }` WHEN any command runs without flag/env THEN gemini is used.
- GIVEN `--provider xyz` (unsupported) WHEN any command runs THEN `validateProvider` exits with error listing `"anthropic, openai, gemini"`.

### R2 — API key resolution supports Gemini

**Scenarios:**
- GIVEN `GEMINI_API_KEY` env var set WHEN `resolveApiKey("gemini")` runs THEN returns env value.
- GIVEN env unset AND `config.geminiApiKey` set WHEN `resolveApiKey("gemini")` runs THEN returns config value.
- GIVEN both unset WHEN `resolveApiKey("gemini")` runs THEN returns `undefined`.

### R3 — Init command offers Gemini as a choice

**Scenarios:**
- GIVEN `aidev init` runs THEN the provider select prompt shows `{anthropic, openai, gemini}`.
- GIVEN user selects "gemini" AND pastes a key not starting with `AIza` THEN a soft warning appears but init does not exit (non-Gemini keys may still be valid — soft validation).
- GIVEN user selects "gemini" AND pastes `AIza...` key THEN validation passes, key saved to `config.geminiApiKey`.

### R4 — Progress keys are prefixed by provider

**Scenarios:**
- GIVEN `recordPass("01-foo", "starter", "gemini")` runs THEN progress map gains entry `"gemini:01-foo"`.
- GIVEN existing progress has `"anthropic:01-x"` and `"openai:02-y"` WHEN Gemini progress is added THEN three prefixes coexist.

### R5 — Exercise discovery supports gemini directory

**Scenarios:**
- GIVEN `exercises/gemini/` exists with valid exercises WHEN `listExercises({provider:"gemini"})` runs THEN only gemini exercises are returned.
- GIVEN `meta.json` declares `"provider": "gemini"` WHEN parsed THEN `ExerciseMeta.provider === "gemini"`.
