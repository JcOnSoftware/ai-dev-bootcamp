> Authoritative spec — last updated from archived change `add-run-command` on `2026-04-14`. Historical deltas for this capability live under `openspec/changes/archive/2026-04-14-add-run-command/specs/exercise-playground/spec.md`.

# exercise-playground Specification

## Purpose

The `exercise-playground` capability lets learners execute a single exercise against the real Anthropic API and inspect the model's actual output — tokens consumed, cost, duration, and full response text — without running tests or touching progress.

---

## Requirements

### Requirement: Execute exercise and display summary

The system MUST load `starter.ts` (default) or `solution.ts` (when `--solution` is given), invoke its default export via the existing `runUserCode()` harness, and print a human-readable summary to stdout.

The summary MUST include: exercise id, target (`starter` | `solution`), model used, `input_tokens`, `output_tokens`, estimated cost, duration in ms, and the text content of the response.

All human-readable strings MUST go through `t()` (locale-aware).

#### Scenario: Happy path — non-streaming exercise

- GIVEN a valid exercise with a working `starter.ts` and a valid `ANTHROPIC_API_KEY`
- WHEN the user runs `aidev run 01-first-call`
- THEN the command executes the exercise's default export via `runUserCode()`
- AND prints a summary containing: exercise id, target (`starter`), model used, `input_tokens`, `output_tokens`, estimated cost, duration (ms), and the text content of the first `text` block in the response
- AND exits with code 0

#### Scenario: Happy path — streaming exercise

- GIVEN exercise `03-streaming` with a valid `solution.ts` and a valid API key
- WHEN the user runs `aidev run 03-streaming --solution`
- THEN the summary includes: target (`solution`), model, `input_tokens`, `output_tokens`, accumulated text, and duration
- AND exits with code 0

---

### Requirement: --solution flag

The system MUST execute `solution.ts` instead of `starter.ts` when `--solution` is given.
The system MUST NOT record any progress regardless of flag combination.

#### Scenario: Run with --solution

- GIVEN an exercise with a `solution.ts`
- WHEN the user runs `aidev run <id> --solution`
- THEN `solution.ts` is resolved and passed to `runUserCode()`
- AND no write to `~/.aidev/progress.json` occurs

---

### Requirement: --stream-live flag

When `--stream-live` is given and the exercise uses streaming, each `text_delta` event MUST be printed to stdout in real-time as it arrives, before the final summary appears.

When `--stream-live` is given but the exercise does NOT use streaming, the flag MUST be silently ignored.

#### Scenario: Stream-live on a streaming exercise

- GIVEN exercise `03-streaming` and flag `--stream-live`
- WHEN the user runs `aidev run 03-streaming --stream-live`
- THEN each `text_delta` is printed to stdout as it arrives
- AND after all deltas the summary is printed
- AND exits with code 0

#### Scenario: Stream-live on a non-streaming exercise

- GIVEN exercise `01-first-call` (non-streaming) and flag `--stream-live`
- WHEN the user runs `aidev run 01-first-call --stream-live`
- THEN no live delta output is produced
- AND the normal summary is printed
- AND exits with code 0

---

### Requirement: --full flag and output truncation

Without `--full`, any text content exceeding 2000 characters MUST be truncated and an indicator appended: `[...truncated N chars, use --full to see all]`.

With `--full`, the entire content MUST be printed without truncation.

#### Scenario: Long output without --full

- GIVEN a response whose text content is > 2000 characters
- WHEN the user runs `aidev run <id>` without `--full`
- THEN the first 2000 characters are printed followed by the truncation indicator

#### Scenario: Long output with --full

- GIVEN the same response
- WHEN the user runs `aidev run <id> --full`
- THEN the complete text is printed with no truncation indicator

---

### Requirement: Structured object return rendering

When the exercise's return value is a plain object with one or more top-level keys, each key MUST be rendered as a labeled section: `--- <key> ---` followed by the text content of the value at that key.

#### Scenario: Exercise returns { deterministic, creative }

- GIVEN exercise `02-params` which returns `{ deterministic: Message, creative: Message }`
- WHEN the user runs `aidev run 02-params`
- THEN the output contains a `--- deterministic ---` section with the text of that message
- AND a `--- creative ---` section with the text of the creative message

---

### Requirement: Primitive or non-standard return shape

When the exercise return value is a primitive, an array, or an object that does not match the structured-object rendering path, the system MUST fall back to `JSON.stringify(value, null, 2)` with a label `t("run.return_value_label")`.

---

### Requirement: Exercise throws during execution

When the exercise's default export throws during invocation, the command MUST:
1. Print the error message to stderr.
2. Print a stack trace to stderr.
3. Print any API calls captured BEFORE the throw (may be empty).
4. Exit with a non-zero code.

---

### Requirement: Cost estimation

- If `meta.json` contains a `model_cost_hint` string, the summary MUST print that string verbatim as the cost line.
- If `model_cost_hint` is absent, compute a best-effort estimate using a built-in per-million-tokens lookup table for known model families (Haiku, Sonnet, Opus). If the model ID is not in the lookup table, display "cost ~ check model pricing".

#### Scenario: Cost with model_cost_hint present

- GIVEN `meta.json` has `model_cost_hint: "~$0.001/run (Haiku 4.5)"`
- WHEN the summary is rendered
- THEN the cost line reads exactly `~$0.001/run (Haiku 4.5)`

#### Scenario: Cost with known model, no hint

- GIVEN `meta.json` has no `model_cost_hint` and the model is a known Haiku ID
- WHEN the summary is rendered
- THEN the cost line shows a computed estimate based on the lookup table

#### Scenario: Cost with unknown model, no hint

- GIVEN `meta.json` has no `model_cost_hint` and the model ID is unknown
- WHEN the summary is rendered
- THEN the cost line reads `cost ~ check model pricing` (localized)

---

### Requirement: No API key

When no `ANTHROPIC_API_KEY` is resolvable, the command MUST exit with code 1 and print localized error + hint messages.

---

### Requirement: Unknown exercise id

When the exercise id does not match any known exercise, the command MUST exit with code 1 and print `t("run.not_found", { id })` to stderr.
