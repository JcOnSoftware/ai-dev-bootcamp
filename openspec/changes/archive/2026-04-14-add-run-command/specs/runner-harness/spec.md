# Delta for runner-harness

## ADDED Requirements (conditional — design must pick Option A or B)

### Requirement: Stream-event observation hook (Option A — harness extension)

**Option A**: `RunOptions` MAY gain an optional `onStreamEvent?: (event: MessageStreamEvent) => void` callback. When provided, the harness MUST invoke it for each event in the `for-await` loop inside `captureStreamWhenDone` (or equivalent iteration), in order, before proceeding to the next event. When the callback is NOT provided, harness behavior MUST be identical to the pre-change baseline.

**Trade-offs**:
- PRO: single interception point; no second patch layer; consistent with the harness's existing ownership of SDK interception.
- PRO: the callback receives typed `MessageStreamEvent` objects — strongly typed, no string parsing.
- CON: harness gains a display concern (printing deltas) — slightly violates separation of concerns unless the callback contract is kept generic (just "receive event", not "print event").
- CON: requires modifying `@aidev/runner` alongside `@aidev/cli`; small but real coupling increase.

#### Scenario: Callback invoked for each stream event (Option A)

- GIVEN `runUserCode(path, { onStreamEvent: cb })` is called
- AND the exercise uses `messages.stream()`
- WHEN streaming completes
- THEN `cb` was called once for each `MessageStreamEvent` in arrival order
- AND the final `HarnessResult` is identical to a run without the callback

#### Scenario: No callback — existing behavior unchanged (Option A)

- GIVEN `runUserCode(path, {})` is called (no `onStreamEvent`)
- WHEN the exercise runs
- THEN `HarnessResult` is identical to pre-change baseline (no regression)

---

### Requirement: Stream-event tee-patch (Option B — no harness change)

**Option B**: The `run` command implements its own secondary monkey-patch of `Messages.prototype.stream` inside the command action, teeing events to a live-print loop before forwarding them to the exercise.

**Trade-offs**:
- PRO: zero changes to `@aidev/runner`; harness API surface stays frozen.
- CON: creates a SECOND patch layer on `Messages.prototype.stream`. The harness already patches it. Two patches in sequence are fragile — order matters, and a future harness change could silently break the tee.
- CON: the critical APIPromise preservation invariant must be re-verified in this second patch context.
- CON: the run command reaches into SDK internals, duplicating knowledge that belongs in the harness.

#### Scenario: Tee-patch does not regress APIPromise (Option B)

- GIVEN the tee-patch is applied before `runUserCode()` is called
- AND the exercise uses `messages.stream()` with `.finalMessage()`
- WHEN the exercise runs
- THEN `.finalMessage()` resolves correctly (APIPromise chain intact)
- AND `HarnessResult.calls` still contains the captured streaming call

---

## Design decision required

The DESIGN phase MUST pick exactly ONE of Option A or Option B and justify the choice.

Recommendation for design consideration: Option A is preferred because it avoids a double-patch situation that created bugs before (see engram #89 — "APIPromise preservation gotcha"). The harness is the single designated owner of SDK interception; extending it with an optional hook is lower risk than introducing a second independent patch.

The spec does NOT mandate Option A — the design phase has final authority.

---

## Outcome

**Design chose Option A** (harness hook via `MessageStream.on("streamEvent", cb)` EventEmitter API — NOT an async wrapper, NOT a second prototype patch). See design.md ADR-1 for full rationale.
