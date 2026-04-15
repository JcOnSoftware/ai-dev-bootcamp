# Tasks: add-tool-use-track

Change: `add-tool-use-track`
Phase: tasks
Total: 62 tasks across 6 batches
Strict TDD: ENABLED — tests-first always, solution only written after FAIL confirmed.

---

## Batch 1 — 01-basic-tool (11 tasks)

- [ ] B1-T01: Create dirs `code/packages/exercises/03-tool-use/01-basic-tool/`, `es/`, `en/`
- [ ] B1-T02: Write `tests.test.ts` — 5 tests: tools.length===1 + name==="get_weather", stop_reason==="tool_use", tool_use content block with .name + .input.location, model /haiku/i, calls.length===1
- [ ] B1-T03: Write `starter.ts` — `// Docs: https://platform.claude.com/docs/tool-use` header; export GET_WEATHER_TOOL schema; export executeGetWeather (TODO throw); export default run() stub (TODO throw)
- [ ] B1-T04: `AIDEV_TARGET=starter bun test packages/exercises/03-tool-use/01-basic-tool` from `code/` → confirm FAIL
- [ ] B1-T05: Write `solution.ts` — messages.create with tools=[GET_WEATHER_TOOL], model claude-haiku-4-5-20251001, single call; implement executeGetWeather returning JSON string
- [ ] B1-T06: `AIDEV_TARGET=solution bun test packages/exercises/03-tool-use/01-basic-tool` from `code/` → GREEN
- [ ] B1-T07: Write `es/exercise.md` — 6 sections (Objetivo, Contexto, Tu tarea, Pistas, Criterios de éxito, Recursos)
- [ ] B1-T08: Write `en/exercise.md` — 6 equivalent sections in English
- [ ] B1-T09: Write `meta.json` — id:"01-basic-tool", track:"03-tool-use", title:"Basic Tool Use", version:"1.0.0", valid_until:"2026-10-15", concepts:["tool-definition","tool_use-stop-reason","single-call"], estimated_minutes:20, requires:["01-first-call"], locales:["es","en"], model_cost_hint:"haiku"
- [ ] B1-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "01-basic-tool" appears under 03-tool-use
- [ ] B1-T11: `bun packages/cli/src/index.ts verify 01-basic-tool --solution` → GREEN. Commit: `feat(exercises/03-tool-use/01-basic-tool): add basic tool use exercise`

---

## Batch 2 — 02-tool-loop (11 tasks)

- [ ] B2-T01: Create dirs `code/packages/exercises/03-tool-use/02-tool-loop/`, `es/`, `en/`
- [ ] B2-T02: Write `tests.test.ts` — integration: calls.length===2, call1 has tool_use block, call2 last user message has tool_result with matching tool_use_id, call2 stop_reason==="end_turn", model /haiku/i; unit: executeGetWeather returns JSON string (no API)
- [ ] B2-T03: Write `starter.ts` — Docs header; export GET_WEATHER_TOOL; export executeGetWeather (TODO throw); export default run() stub (TODO throw)
- [ ] B2-T04: `AIDEV_TARGET=starter bun test packages/exercises/03-tool-use/02-tool-loop` from `code/` → FAIL
- [ ] B2-T05: Write `solution.ts` — 2-turn loop: call1 with tools, extract tool_use, call executeGetWeather, call2 with tool_result; export executeGetWeather
- [ ] B2-T06: `AIDEV_TARGET=solution bun test packages/exercises/03-tool-use/02-tool-loop` from `code/` → GREEN
- [ ] B2-T07: Write `es/exercise.md` — 6 sections covering multi-turn flow, tool_result structure, conversation continuation
- [ ] B2-T08: Write `en/exercise.md` — 6 sections in English
- [ ] B2-T09: Write `meta.json` — id:"02-tool-loop", track:"03-tool-use", title:"Tool Loop", version:"1.0.0", valid_until:"2026-10-15", concepts:["multi-turn","tool-result","tool-loop"], estimated_minutes:25, requires:["01-basic-tool"], locales:["es","en"], model_cost_hint:"haiku"
- [ ] B2-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "02-tool-loop" under 03-tool-use
- [ ] B2-T11: `bun packages/cli/src/index.ts verify 02-tool-loop --solution` → GREEN. Commit: `feat(exercises/03-tool-use/02-tool-loop): add tool loop exercise`

---

## Batch 3 — 03-multiple-tools (11 tasks)

- [ ] B3-T01: Create dirs `code/packages/exercises/03-tool-use/03-multiple-tools/`, `es/`, `en/`
- [ ] B3-T02: Write `tests.test.ts` — integration: calls.length===2, calls[0].request.tools.length===2, tool_use block name==="calculate" with input.operation==="multiply", final text /5254|5,254/; unit: executeCalculate multiply correct, executeCalculate divide-by-zero throws (no API)
- [ ] B3-T03: Write `starter.ts` — Docs header; export GET_WEATHER_TOOL, CALCULATE_TOOL; export executeGetWeather, executeCalculate (TODO throw), executeTool routing (TODO throw for unknown); export default run() stub (TODO throw)
- [ ] B3-T04: `AIDEV_TARGET=starter bun test packages/exercises/03-tool-use/03-multiple-tools` from `code/` → FAIL
- [ ] B3-T05: Write `solution.ts` — run() with both tools, prompt triggers calculate(multiply); 2-turn loop using executeTool dispatcher; export executeCalculate, executeTool
- [ ] B3-T06: `AIDEV_TARGET=solution bun test packages/exercises/03-tool-use/03-multiple-tools` from `code/` → GREEN
- [ ] B3-T07: Write `es/exercise.md` — 6 sections: múltiples herramientas, enrutamiento por nombre, esquema con enum, criterio suave de texto
- [ ] B3-T08: Write `en/exercise.md` — 6 sections in English
- [ ] B3-T09: Write `meta.json` — id:"03-multiple-tools", track:"03-tool-use", title:"Multiple Tools", version:"1.0.0", valid_until:"2026-10-15", concepts:["multiple-tools","tool-routing","json-schema-enum"], estimated_minutes:30, requires:["02-tool-loop"], locales:["es","en"], model_cost_hint:"haiku"
- [ ] B3-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "03-multiple-tools" under 03-tool-use
- [ ] B3-T11: `bun packages/cli/src/index.ts verify 03-multiple-tools --solution` → GREEN. Commit: `feat(exercises/03-tool-use/03-multiple-tools): add multiple tools exercise`

---

## Batch 4 — 04-tool-choice (11 tasks)

- [ ] B4-T01: Create dirs `code/packages/exercises/03-tool-use/04-tool-choice/`, `es/`, `en/`
- [ ] B4-T02: Write `tests.test.ts` — calls.length===4; calls[0] tool_choice auto (type==="auto" or absent); calls[1] tool_choice toEqual({type:"any"}); calls[2] tool_choice toEqual({type:"tool",name:"calculate"}) + response has tool_use name==="calculate"; calls[3] response.content has NO tool_use block; model /haiku/i on calls[0]
- [ ] B4-T03: Write `starter.ts` — Docs header; export GET_WEATHER_TOOL, CALCULATE_TOOL; export default run() stub returning Promise<{auto,any,named,none}> (TODO throw)
- [ ] B4-T04: `AIDEV_TARGET=starter bun test packages/exercises/03-tool-use/04-tool-choice` from `code/` → FAIL
- [ ] B4-T05: Write `solution.ts` — run() issues 4 sequential messages.create with same numeric prompt; tool_choice: auto / {type:"any"} / {type:"tool",name:"calculate"} / {type:"none"}; return {auto,any,named,none}
- [ ] B4-T06: `AIDEV_TARGET=solution bun test packages/exercises/03-tool-use/04-tool-choice` from `code/` → GREEN
- [ ] B4-T07: Write `es/exercise.md` — 6 sections: opciones de tool_choice (auto/any/tool/none), cuándo usar cada una, tarea de 4 llamadas
- [ ] B4-T08: Write `en/exercise.md` — 6 sections in English
- [ ] B4-T09: Write `meta.json` — id:"04-tool-choice", track:"03-tool-use", title:"Tool Choice", version:"1.0.0", valid_until:"2026-10-15", concepts:["tool_choice","forced-tool","no-tool"], estimated_minutes:25, requires:["03-multiple-tools"], locales:["es","en"], model_cost_hint:"haiku"
- [ ] B4-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "04-tool-choice" under 03-tool-use
- [ ] B4-T11: `bun packages/cli/src/index.ts verify 04-tool-choice --solution` → GREEN. Commit: `feat(exercises/03-tool-use/04-tool-choice): add tool choice exercise`

---

## Batch 5 — 05-parallel-tools (11 tasks)

- [ ] B5-T01: Create dirs `code/packages/exercises/03-tool-use/05-parallel-tools/`, `es/`, `en/`
- [ ] B5-T02: Write `tests.test.ts` — calls.length===2; calls[0].response.content.filter(b=>b.type==="tool_use").length >= 1; calls[1] last user message tool_result count equals tool_use count from calls[0]; all tool_use_ids matched; calls[1] stop_reason==="end_turn"; model /haiku/i
- [ ] B5-T03: Write `starter.ts` — Docs header; export GET_WEATHER_TOOL; export executeGetWeather (TODO throw); export default run() stub (TODO throw); comment: "Claude may call get_weather multiple times in parallel — handle ALL tool_use blocks"
- [ ] B5-T04: `AIDEV_TARGET=starter bun test packages/exercises/03-tool-use/05-parallel-tools` from `code/` → FAIL
- [ ] B5-T05: Write `solution.ts` — run() call1 with multi-city prompt; collect ALL tool_use blocks; build single user message with one tool_result per block; call2; return call2 result
- [ ] B5-T06: `AIDEV_TARGET=solution bun test packages/exercises/03-tool-use/05-parallel-tools` from `code/` → GREEN
- [ ] B5-T07: Write `es/exercise.md` — 6 sections: llamadas paralelas, por qué batching de tool_results, non-determinismo, criterio >=1
- [ ] B5-T08: Write `en/exercise.md` — 6 sections in English
- [ ] B5-T09: Write `meta.json` — id:"05-parallel-tools", track:"03-tool-use", title:"Parallel Tools", version:"1.0.0", valid_until:"2026-10-15", concepts:["parallel-tool-use","batched-tool-results","non-determinism"], estimated_minutes:30, requires:["04-tool-choice"], locales:["es","en"], model_cost_hint:"haiku"
- [ ] B5-T10: `bun packages/cli/src/index.ts list` from `code/` → confirm "05-parallel-tools" under 03-tool-use
- [ ] B5-T11: `bun packages/cli/src/index.ts verify 05-parallel-tools --solution` → GREEN. Commit: `feat(exercises/03-tool-use/05-parallel-tools): add parallel tools exercise`

---

## Batch 6 — Final validation (7 tasks)

- [ ] B6-T01: `bunx tsc --noEmit` from `code/` → zero TypeScript errors
- [ ] B6-T02: `bun test packages/cli packages/runner` from `code/` → non-integration suite GREEN
- [ ] B6-T03: `AIDEV_TARGET=solution bun test packages/exercises/03-tool-use/` from `code/` → all 5 integration suites GREEN (requires ANTHROPIC_API_KEY)
- [ ] B6-T04: `bun packages/cli/src/index.ts list` → visually confirm all 5 exercises under 03-tool-use with correct titles
- [ ] B6-T05: `bun packages/cli/src/index.ts progress` → confirm 03-tool-use shows 0/5 (no verify runs recorded)
- [ ] B6-T06: `git log --oneline -10` → confirm 5 commits with `feat(exercises/03-tool-use/...)` subjects; no Co-Authored-By
- [ ] B6-T07: Check CONTRIBUTING.md — if no new conventions introduced (no fixtures, no new patterns), no change needed; otherwise add one sentence and commit `docs(contributing): note <convention>`
