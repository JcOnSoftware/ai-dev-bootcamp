---
source: engram
archived_at: 2026-04-14
engram_topic: sdd/add-run-command/design
---

# Design: add-run-command

## 1. Overview

`aidev run <id>` is a thin CLI command that reuses the existing `@aidev/runner` harness to execute a learner's exercise module (starter or solution) against the real Anthropic API, then renders a human-readable summary (model, tokens, cost, duration, response text). It complements `verify` (which runs tests and records progress) without replacing it — `run` NEVER writes to `~/.aidev/progress.json`.

The only non-trivial piece is `--stream-live`: the harness currently patches `Messages.prototype.stream` and captures the final message via `.finalMessage()`. To tee per-event deltas to stdout while keeping the existing capture intact, the harness is extended with an optional `onStreamEvent` callback on `RunOptions` (Option A). Rendering, cost estimation, and truncation live in the CLI package in small, test-seamable modules (`cost.ts`, `render.ts`). All strings flow through `t()` under the `run.*` namespace in both `es.json` and `en.json`.

## 2. Component diagram

```
                ┌──────────────────────────┐
                │   aidev CLI (commander)  │
                │  program.preAction hook  │
                │  → resolveLocale+initI18n│
                └──────────┬───────────────┘
                           │ delegates
                           ▼
      ┌──────────────────────────────────────┐
      │ packages/cli/src/commands/run.ts     │
      │  - parse flags                       │
      │  - findExercise(id)                  │
      │  - resolveApiKey()                   │
      │  - build onStreamEvent if --stream-  │
      │    live (writes text_delta chunks to │
      │    stdout)                           │
      │  - call runUserCode(path, {hook})    │
      │  - renderSummary(result, exercise,   │
      │    opts) → stdout                    │
      └──┬────────────┬──────────────────┬───┘
         │            │                  │
         ▼            ▼                  ▼
  ┌─────────────┐ ┌──────────┐  ┌────────────────────┐
  │ cost.ts     │ │ render.ts│  │ @aidev/runner      │
  │ estimateCost│ │ render   │  │ runUserCode(…,     │
  │ + table     │ │ Summary  │  │   {onStreamEvent}) │
  └─────────────┘ └──────────┘  │ patches Messages.  │
                                 │ prototype.{create, │
                                 │ stream}            │
                                 └─────────┬──────────┘
                                           ▼
                                   Anthropic SDK
```

## 3. Command flow (sequence) — `aidev run 02-params --stream-live`

```
User → commander: parse argv
commander → preAction: resolveLocale → initI18n(es)
commander → runCommand.action(id, opts)
  runCommand → exercises.findExercise("02-params")
  runCommand → config.resolveApiKey() → "sk-ant-…"
  runCommand → build onStreamEvent (only if opts.streamLive)
  runCommand → runner.runUserCode(starter.ts, {onStreamEvent})
    runner → patchMessages(calls, pending, onStreamEvent)
    runner → import(exercise module) → invoke default export
      user → client.messages.stream(...)  [patched]
        runner → originalStream(...)          (returns MessageStream)
        runner → tee(stream, onStreamEvent)   (wraps async iterator)
        runner → pendingCaptures.push(captureStreamWhenDone(...))
      user → for-await stream → each event:
        tee yields event + calls onStreamEvent(event)
        onStreamEvent → if text_delta → process.stdout.write(delta.text)
      user → stream.finalMessage() → captured into calls[]
    runner → await pendingCaptures
    runner → return {calls, lastCall, userReturn}
  runCommand → render.renderSummary(result, exercise, opts)
    render → estimateCost(model, usage) [from cost.ts or meta.model_cost_hint]
    render → print "--- deterministic ---\n<text>" etc. (per-key rendering)
  runCommand → exit 0
```

## 4. Harness API change (diff sketch)

```ts
// packages/runner/src/harness.ts
export interface RunOptions {
  entry?: string;
  /** NEW: invoked for each event emitted by messages.stream(...). */
  onStreamEvent?: (event: MessageStreamEvent) => void;
}

// runUserCode passes options.onStreamEvent into patchMessages.
```

Key property: the user's own `for await` loop is untouched. We subscribe via the EventEmitter API that `MessageStream` already exposes (`.on("streamEvent", …)`), which runs in parallel with iteration and leaves the APIPromise chain intact. No async wrapping, no double-patch.

```ts
function teeStreamEvents(
  stream: unknown,
  cb: (e: MessageStreamEvent) => void,
) {
  const s = stream as { on?: (name: string, fn: (e: unknown) => void) => void };
  if (typeof s.on === "function") {
    s.on("streamEvent", (e) => {
      try { cb(e as MessageStreamEvent); } catch { /* never crash user code */ }
    });
  }
}
```

## 5. `run` command (pseudocode, ≤100 LOC target)

```ts
export const runCommand = new Command("run")
  .argument("<id>", "Exercise id (e.g. 02-params)")
  .option("--solution", "Run solution.ts instead of starter.ts")
  .option("--stream-live", "Print streaming deltas in real time")
  .option("--full", "Disable output truncation")
  .option("--locale <code>", "Locale override for this invocation (es|en)")
  .action(async (id, opts) => {
    const exercise = await findExercise(id);
    if (!exercise) { console.error(t("run.not_found", { id })); process.exit(1); }
    const apiKey = await resolveApiKey();
    if (!apiKey) { console.error(t("run.no_key")); process.exit(1); }
    process.env.ANTHROPIC_API_KEY = apiKey;
    const target = opts.solution ? "solution" : "starter";
    process.env.AIDEV_TARGET = target;
    const filePath = join(exercise.dir, `${target}.ts`);
    const onStreamEvent = opts.streamLive ? (e) => { /* print text_delta */ } : undefined;
    try {
      const result = await runUserCode(filePath, { onStreamEvent });
      if (opts.streamLive) process.stdout.write("\n");
      console.log(renderSummary(result, exercise, { full: Boolean(opts.full), target }));
      process.exit(0);
    } catch (err) {
      console.error(t("run.error.message", { message: (err as Error).message }));
      process.exit(1);
    }
  });
```

## 6. Cost module (`packages/cli/src/cost.ts`)

```ts
export const MODEL_PRICES = {
  lastUpdated: "2026-04",
  families: [
    { match: /haiku/i,  input: 1.0,  output: 5.0  },
    { match: /sonnet/i, input: 3.0,  output: 15.0 },
    { match: /opus/i,   input: 15.0, output: 75.0 },
  ] as const,
};

export function estimateCost(model: string, usage: Usage): string | null {
  const hit = MODEL_PRICES.families.find(f => f.match.test(model));
  if (!hit) return null;
  const cost = (usage.input_tokens / 1_000_000) * hit.input
             + (usage.output_tokens / 1_000_000) * hit.output;
  return `~$${cost.toFixed(4)}`;
}
```

Resolution order in render:
1. If `exercise.meta.model_cost_hint` → print verbatim.
2. Else `estimateCost(...)` → if non-null, print it + "(est, prices {lastUpdated})".
3. Else → print `t("run.cost_unknown")` ("cost ~ check model pricing").

## 7. Output rendering (`packages/cli/src/render.ts`)

Three-way shape detection in `renderReturn`:
1. `isMessage(v)` (has `id: string` + `content: Array`) → render text
2. Plain object (not array, not null, not Message) → per-key labeled rendering
3. Fallback → `JSON.stringify` under `t("run.return_value_label")`

`MAX_CHARS = 2000` constant. `truncate(s, full)` helper.

## 8. i18n keys (bilingual, ready for copy-paste)

```jsonc
// es.json additions
"run.title": "▶ Ejecución de {id} ({target})",
"run.running": "→ Ejecutando {id} contra {target}.ts",
"run.summary.model": "Modelo: {model}",
"run.summary.tokens": "Tokens: entrada {input} · salida {output}",
"run.summary.cost": "Costo: {cost}",
"run.summary.duration": "Duración: {ms}ms",
"run.cost_unknown": "costo ~ revisá los precios del modelo",
"run.truncated": "[... truncado {n} caracteres, usá --full para ver todo]",
"run.return_value_label": "Valor de retorno",
"run.not_found": "Ejercicio '{id}' no encontrado. Probá: aidev list",
"run.no_key": "No se encontró API key de Anthropic.",
"run.no_key_hint": "  Corré 'aidev init' o exportá ANTHROPIC_API_KEY.",
"run.error.message": "Error al ejecutar: {message}",
"run.error.hint": "  Revisá el código del ejercicio y volvé a intentar."

// en.json additions
"run.title": "▶ Running {id} ({target})",
"run.running": "→ Running {id} against {target}.ts",
"run.summary.model": "Model: {model}",
"run.summary.tokens": "Tokens: input {input} · output {output}",
"run.summary.cost": "Cost: {cost}",
"run.summary.duration": "Duration: {ms}ms",
"run.cost_unknown": "cost ~ check model pricing",
"run.truncated": "[... truncated {n} chars, use --full to see all]",
"run.return_value_label": "Return value",
"run.not_found": "Exercise '{id}' not found. Try: aidev list",
"run.no_key": "No Anthropic API key found.",
"run.no_key_hint": "  Run 'aidev init' or export ANTHROPIC_API_KEY.",
"run.error.message": "Execution error: {message}",
"run.error.hint": "  Check the exercise code and retry."
```

## 9. Tests plan (Strict TDD)

| Layer | Target | Test ideas |
|-------|--------|------------|
| Unit | `cost.ts` | Haiku/Sonnet/Opus match; unknown model → null; zero tokens |
| Unit | `render.ts` truncate | Short string unchanged; long string truncated; `full=true` never truncates |
| Unit | `render.ts` shape detection | Message → text; `{a: Message, b: Message}` → labeled; primitive → label; array → JSON |
| Unit | harness hook | Fake MessageStream with `.on("streamEvent", cb)`; assert cb invoked in order; HarnessResult.calls still populated |
| Unit | harness no-hook regression | Baseline HarnessResult unchanged without callback |
| Integration | `aidev run 01-first-call --solution` (real API, guarded) | stdout contains "Model:" line + non-empty response text |
| Integration | `aidev run 03-streaming --solution --stream-live` | deltas BEFORE "Model:" summary line |
| Integration | `aidev run xx-missing` | Exit 1, stderr localized "not found" |
| Integration | `aidev run 01-first-call` with no API key | Exit 1, `run.no_key` |
| Integration | `run` does NOT write `~/.aidev/progress.json` | Before/after stat unchanged |

## 10. Files to create / modify

| File | Status | Purpose |
|------|--------|---------|
| `code/packages/runner/src/harness.ts` | Modify | `onStreamEvent` on `RunOptions`; `teeStreamEvents` helper |
| `code/packages/runner/src/index.ts` | Modify | Re-export `MessageStreamEvent` |
| `code/packages/runner/src/harness.test.ts` | New/Modify | Hook invocation + no-hook regression tests |
| `code/packages/cli/src/commands/run.ts` | New | Command implementation |
| `code/packages/cli/src/cost.ts` | New | Price table + `estimateCost()` |
| `code/packages/cli/src/cost.test.ts` | New | Cost unit tests |
| `code/packages/cli/src/render.ts` | New | `renderSummary`, `renderReturn`, `truncate`, helpers |
| `code/packages/cli/src/render.test.ts` | New | Render unit tests |
| `code/packages/cli/src/commands/run.test.ts` | New | Integration tests |
| `code/packages/cli/src/index.ts` | Modify | `program.addCommand(runCommand)` |
| `code/packages/cli/src/i18n/es.json` | Modify | Add `run.*` keys |
| `code/packages/cli/src/i18n/en.json` | Modify | Add `run.*` keys |
| `docs/EXERCISE-CONTRACT.md` | Modify | One-paragraph playground note |

## 11. ADRs

### ADR-1: Harness hook vs secondary patch for `--stream-live`
**Chosen**: Option A — harness hook via `MessageStream.on("streamEvent", …)`. NOT a second `prototype.stream` patch, NOT an async-iterator wrapper.
**Rejected**: Option B (CLI-side tee-patch): double-patch, fragile ordering, re-opens APIPromise gotcha risk.
**Consequences**: `@aidev/runner` gains one optional option and one tiny subscriber. Negligible coupling increase. Zero regression surface when `onStreamEvent` is undefined.

### ADR-2: Return-value shape detection
**Chosen**: 3-way heuristic: `isMessage(v)` → text; plain object → per-key labeled; fallback → JSON under return_value_label.
**Rejected**: TypeScript type inspection (post-erasure, impossible). Exercise `toPlaygroundDisplay()` protocol (breaks learner-code realism).

### ADR-3: Cost estimation when `model_cost_hint` missing
**Chosen**: Static family-keyed regex table in `cost.ts` with `lastUpdated: "2026-04"`. Unknown → localized `run.cost_unknown`.
**Rejected**: Exact-ID table (stale fast). Network fetch (dependency).

### ADR-4: Output truncation
**Chosen**: `MAX_CHARS = 2000` visible characters. `--full` disables. Truncation suffix localized via `t("run.truncated", {n})`.
**Rejected**: Bytes (UTF-8 math complicates). Config-file setting (over-engineered for v1).

### ADR-5: Cost precedence — hint vs computed
**Chosen**: `model_cost_hint` WINS (verbatim). When absent, compute from table. When neither, localized fallback.
**Rejected**: Show both (clutters summary). Always compute (ignores author intent).

## 12. Risks and mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| APIPromise regression in harness modification | Low | ADR-1 uses `.on("streamEvent", …)` — no wrapping. Regression tests: 01/02/03 exercise suites. |
| `MessageStream.on("streamEvent", …)` not available | Low | `@anthropic-ai/sdk ^0.40` exposes it; guard with `typeof s.on === "function"` |
| Pricing staleness misleads learners | Med | `lastUpdated` field printed with every estimate |
| Unknown return shape | Low | JSON.stringify under labeled fallback; never throws |
| `process.stdout.write` buffering reorders deltas vs. summary | Low | Summary only emitted AFTER `runUserCode` resolves |
