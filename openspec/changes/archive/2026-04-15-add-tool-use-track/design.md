# Design — add-tool-use-track

## Architecture overview

No new runtime modules. All changes are **content** — 5 exercises in a new track directory `code/packages/exercises/03-tool-use/`. The existing harness, CLI, and exercise contract already support everything needed:

- `runUserCode()` captures every `messages.create` call into `HarnessResult.calls[]` — no patch required for multi-turn flows.
- `listExercises()` groups by `trackSlug` dynamically; the new track auto-appears once files exist.
- `resolveExerciseFile(import.meta.url)` + `AIDEV_TARGET` switches starter/solution without file swaps.

### Single-call flow (exercises 01, 04)

```
run() → client.messages.create({ tools, tool_choice? })
      → harness captures calls[0] = { request, response }
      → return response
tests → assert on calls[0].request.tools / tool_choice / response.content[].type
```

### Multi-turn flow (exercises 02, 03, 05)

```
call 1: user prompt        → client.messages.create({ tools })
                           → response1.content includes tool_use blocks
local : for each tool_use  → executeTool(name, input) → string result
call 2: messages extended  → client.messages.create({ tools, messages: [...history, tool_result] })
                           → response2 final text
harness: captures calls[0] and calls[1] as independent entries
tests  : assert stop_reason "tool_use" on calls[0]; text on calls[1]
```

### Back-to-back flow (exercise 04 — tool_choice)

Single `run()` issues 4 sequential `messages.create` calls with different `tool_choice` values. Harness yields `calls[0..3]`; tests assert one request/response shape per slot.

## ADRs

### ADR-1: Weather + calculator domain

**Decision**: Tools are `get_weather(location, unit?)` and `calculate(operation, a, b)`.
**Alternatives considered**: DB lookup, filesystem, HTTP fetch.
**Rationale**: Universally recognizable. Zero domain cognitive load so the learner focuses on the tool-use mechanic (schema, tool_use blocks, tool_result wiring), not the business logic. Matches Anthropic's own canonical examples — learner can cross-reference docs 1:1.

### ADR-2: Enum-based `calculate` schema

**Decision**: `operation: "add" | "subtract" | "multiply" | "divide"` (enum), `a: number`, `b: number`.
**Alternative**: single `expression: string` field.
**Rationale**: (a) Teaches JSON Schema `enum` — a real production pattern for constraining model output. (b) Impossible to produce invalid arithmetic (no `eval()`, no parsing). (c) Makes the `calculate` dispatch trivial — `switch (operation)` — keeps learner focused on the tool protocol, not parsing.

### ADR-3: Exercise 04 uses a single `run()` with 4 back-to-back calls

**Decision**: One `run()` issues 4 `messages.create` invocations with `tool_choice` values `auto`, `any`, `{type:"tool",name:"..."}`, `none`.
**Alternative**: 4 separate `run*()` exports or 4 exercises.
**Rationale**: Matches the harness contract (one default export → one `HarnessResult`). Tests iterate `result.calls[0..3]` — clean, declarative. A learner can see all four behaviors side by side in one file, which is the whole pedagogical point.

### ADR-4: `disable_parallel_tool_use` as "Concepto extra" only

**Decision**: Exercise 05 focuses on **observing** parallel behavior; `disable_parallel_tool_use` is mentioned in the lesson prose but not exercised.
**Rationale**: Adding a 2nd sub-call just to toggle a boolean doubles test complexity without adding conceptual depth. Learners who want it have the docs link.

### ADR-5: No shared fixtures

**Decision**: Tool schemas and `executeTool` helpers are inlined per exercise (duplicated where needed).
**Alternative**: a `03-tool-use/fixtures/tools.ts` shared file.
**Rationale**: Schemas are ~15 lines each. A learner exploring `starter.ts` should see **everything** the exercise needs without jumping files. Duplication < premature abstraction for pedagogy. Also matches the established contract — each exercise is self-contained.

### ADR-6: One soft text assertion in exercise 03

**Decision**: Exercise 03 tests assert a text block matches `/5254|5,254/` (the expected product of 2 × 2627).
**Rationale**: To verify end-to-end routing (Claude picked the right tool, used the result) we must confirm the result flowed back. Pure structural assertions can't catch a model that ignores the tool_result. Tolerance for comma-formatting (`5254` vs `5,254`) absorbs locale drift. This is the **only** text assertion in the track.

### ADR-7: No harness changes

**Decision**: Ship content-only.
**Rationale**: The harness already captures each `messages.create` call into `calls[]`. Multi-turn flows work transparently. We verified `HarnessResult.calls: CapturedCall[]` is already a plural-first shape — nothing to add.

## Module API: per-exercise helper contracts

```ts
// 02-tool-loop — single-tool loop
export function executeGetWeather(input: {
  location: string;
  unit?: "celsius" | "fahrenheit";
}): string; // returns JSON-serializable weather summary

// 03-multiple-tools and 05-parallel-tools — dispatcher
export function executeTool(
  name: string,
  input: Record<string, unknown>,
): string; // routes to executeGetWeather or executeCalculate, returns string

// 03 and 05 — helper used by executeTool
export function executeCalculate(input: {
  operation: "add" | "subtract" | "multiply" | "divide";
  a: number;
  b: number;
}): string; // returns the numeric result as a string, or throws on divide-by-zero
```

All helpers return strings so they can be passed directly as `tool_result.content`.

## Tool schemas (verbatim — apply phase copies these)

```ts
const GET_WEATHER_TOOL = {
  name: "get_weather",
  description: "Get current weather for a city.",
  input_schema: {
    type: "object" as const,
    properties: {
      location: {
        type: "string",
        description: "City name, e.g. Buenos Aires",
      },
      unit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
      },
    },
    required: ["location"],
  },
};

const CALCULATE_TOOL = {
  name: "calculate",
  description: "Perform a basic arithmetic operation on two numbers.",
  input_schema: {
    type: "object" as const,
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"],
      },
      a: { type: "number" },
      b: { type: "number" },
    },
    required: ["operation", "a", "b"],
  },
};
```

## File layout

```
code/packages/exercises/03-tool-use/
├── 01-basic-tool/
│   ├── starter.ts
│   ├── solution.ts
│   ├── tests.test.ts
│   ├── meta.json
│   ├── es/exercise.md
│   └── en/exercise.md
├── 02-tool-loop/
│   └── (same 6-file layout)
├── 03-multiple-tools/
├── 04-tool-choice/
└── 05-parallel-tools/
```

No `fixtures/` subdir. No edits to `code/packages/cli/` or `code/packages/runner/`.

## Testing strategy

### Unit tests (fast, no API)

- `executeGetWeather` — returns expected shape for valid inputs; handles missing `unit` (defaults to `celsius`).
- `executeCalculate` — all four operations; throws on divide-by-zero.
- `executeTool` — routes correctly by name; throws on unknown tool.

Run in-process; no `runUserCode` needed for these assertions.

### Integration tests (real API, guarded by `ANTHROPIC_API_KEY` in `beforeAll`)

Each exercise's `tests.test.ts` uses `resolveExerciseFile(import.meta.url)` + `runUserCode()` and asserts structurally:

| Exercise | Key assertions |
|---|---|
| 01-basic-tool | `calls[0].request.tools` length 1, schema shape; `calls[0].response.content` contains `tool_use` block; `stop_reason === "tool_use"`; model is a Haiku |
| 02-tool-loop | `calls.length === 2`; `calls[0].response.content` has `tool_use`; `calls[1].request.messages` last user turn contains `tool_result`; `calls[1].response.content` has a text block |
| 03-multiple-tools | `calls.length === 2`; `calls[0].request.tools.length === 2`; final text matches `/5254\|5,254/` (ADR-6) |
| 04-tool-choice | `calls.length === 4`; per-slot assertion on `request.tool_choice` and response shape (auto→text-or-tool, any→tool_use present, specific→exact tool name, none→no tool_use blocks) |
| 05-parallel-tools | `calls[0].response.content.filter(b => b.type === "tool_use").length >= 1` (accept 1 but prompt aggressively for parallel); `calls.length === 2` |

### Assertion targets

All integration assertions hit **structure**: `request.tools`, `request.tool_choice`, `request.messages`, `response.content[].type`, `response.stop_reason`, `request.model`. One exception: ADR-6 regex in 03.

## Risk register

1. **Parallel non-determinism (exercise 05)** — Claude may emit 1 tool_use block instead of 2 even with strong prompting. Mitigation: assert `>= 1`; document in exercise prose that production code must always loop regardless of block count.
2. **`tool_choice: "none"` flake** — `stop_reason` may vary. Mitigation: assert absence of `tool_use` blocks rather than a specific `stop_reason`.
3. **Model deprecation** — `claude-haiku-4-5-20251001` may be renamed. Mitigation: `valid_until: 2026-10-15` in each `meta.json` triggers the `[stale]` badge in `aidev list`; existing weekly health-check workflow will surface issues.
4. **Text-format drift (ADR-6)** — if Claude starts formatting 5254 differently (spaces, scientific), the regex fails. Mitigation: regex is intentionally permissive; if drift continues, open a follow-up issue and relax to `/52.?5.?4/` or drop to a structural-only check.

## Implementation order

Strict TDD, one exercise at a time. For each exercise N ∈ {01, 02, 03, 04, 05}:

1. Create `03-tool-use/0N-<slug>/` with `es/` and `en/` subdirs.
2. Write `tests.test.ts` — unit tests for helpers + integration assertions against `runUserCode()`.
3. Write `starter.ts` — `// Docs:` header with canonical `platform.claude.com` URLs; exports stub helpers and `default async function run()` that `throw new Error("TODO: ...")`.
4. `AIDEV_TARGET=starter bun test ./tests.test.ts` — **MUST FAIL** (TDD red gate).
5. Write `solution.ts` — full implementation, model `claude-haiku-4-5-20251001`.
6. `AIDEV_TARGET=solution bun test ./tests.test.ts` — **MUST GREEN** against real API.
7. Write `es/exercise.md` and `en/exercise.md` — 6 required sections each.
8. Write `meta.json` — `id`, `track: "03-tool-use"`, `locales: ["es","en"]`, `valid_until: "2026-10-15"`, `concepts`, `estimated_minutes`, `requires` (previous exercise in track).
9. Conventional commit: `feat(exercises/03-tool-use): add 0N-<slug>`.

After all 5 exercises land:

10. From `code/`: `bun test` (full suite) and `bunx tsc --noEmit` — must both be green.
11. From `code/`: `bun run --cwd packages/cli src/index.ts list` — confirm `03-tool-use` track renders with all 5 exercises.
12. Push.

## Open questions

None. All 9 decisions from the proposal are locked and propagated into ADRs 1–7 + the tool schemas above.
