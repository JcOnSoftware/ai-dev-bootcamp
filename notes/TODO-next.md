# Pending items for next milestones

## M2 — CLI improvements

- `aidev verify --solution` — run tests against `solution.ts` instead of `starter.ts` without file swapping. Useful for contributors and for the weekly CI health check.
- Tests currently hardcode `./starter.ts`. Parameterize via env var (`AIDEV_EXERCISE_TARGET=solution.ts`) so CI can run either.
- `aidev run <id>` — opens exercise.md + starter.ts in `$EDITOR`.
- `aidev hint` — 3-level progressive hints stored in `hints.md` per exercise.

## Harness improvements

- Streaming support: tee the stream so tests can assert on accumulated content AND the user can consume it.
- Capture tool_use loops (multiple `messages.create` calls in sequence) — already supported via the `calls` array, but add helper `getToolCallSequence()` to make test assertions cleaner.
- Timeout wrapper: if user code hangs, kill after N seconds with a clear message.

## Testing contract

- Decide naming: `tests.ts` vs `test.ts` vs `*.test.ts`. Bun discovers `*.test.ts` by default — might be worth aligning to convention.
- Add a `runSolution()` helper in the harness so contributors can dogfood without file swapping.
