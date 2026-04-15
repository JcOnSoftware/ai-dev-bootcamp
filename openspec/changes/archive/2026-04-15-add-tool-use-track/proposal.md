# Proposal: add-tool-use-track

**Change:** `add-tool-use-track`
**Phase:** proposal
**Date:** 2026-04-15
**Artifact store:** hybrid (engram + openspec)

---

## Intent

Agregar el tercer track del bootcamp — `03-tool-use` — con 5 ejercicios progresivos que enseñan tool use de Claude: desde definir un tool y observar un `tool_use` block hasta parallel tool calling con múltiples tools en una sola respuesta. Este track es el puente entre "Claude responde texto" (Foundations + Caching) y los tracks futuros que requieren acción sobre el mundo (RAG, agents, MCP).

## Problem

Hoy el bootcamp enseña a invocar Claude y a cachear prompts, pero no enseña el primitivo más importante para aplicaciones reales: **hacer que Claude llame funciones**. Un senior dev que sale de Foundations + Caching sabe pedir respuestas económicas, pero no sabe:

- Cómo declarar `tools[]` con JSON Schema y leer un `tool_use` block del response
- Cómo cerrar el loop enviando `tool_result` de vuelta para obtener la respuesta final
- Cómo Claude elige entre múltiples tools disponibles en la misma llamada
- Cómo controlar el comportamiento con `tool_choice` (`auto` / `any` / `tool` / `none`)
- Cómo aprovechar parallel tool use nativo en Claude 4+ para pedir varias cosas a la vez

Sin este track, cualquier agent, RAG o integración MCP que intenten construir les va a ser opaco — el tool use loop es la primitiva compartida por todos esos patrones.

## Proposed solution

Nuevo track `code/packages/exercises/03-tool-use/` con **5 ejercicios progresivos** que cubren el ciclo completo de tool use. Dominio pedagógico clásico: **weather + calculator** (`get_weather`, `calculate`) — familiar desde la docs oficial, suficientemente simple para no distraer del concepto, suficientemente rico para cubrir multi-tool y parallel. **Sin harness changes, sin `cost.ts` changes, sin fixtures compartidos** — los schemas de los tools son chicos (<150 tokens) y viven inline en cada `solution.ts`. Bilingüe `es`/`en` desde el día uno.

Detalles API (request/response shape, `tool_choice` semantics, parallel tool use, token overhead, compatibilidad con harness) están documentados en `sdd/add-tool-use-track/explore` — no se duplican acá.

## Scope (in)

- **5 ejercicios** en `code/packages/exercises/03-tool-use/`:
  - `01-basic-tool` — definir `get_weather` con JSON Schema, una sola llamada, observar `stop_reason: "tool_use"` y el `tool_use` block con `{ id, name, input }`
  - `02-tool-loop` — ejecutar el tool localmente, enviar `tool_result` con `tool_use_id` correlacionado, obtener el `end_turn` final (cerrar el loop completo)
  - `03-multiple-tools` — declarar `get_weather` + `calculate` en el mismo array; prompt ambiguo → Claude elige el apropiado
  - `04-tool-choice` — **un solo `run()` con 4 llamadas back-to-back**, una por modo: `{ type: "auto" }`, `{ type: "any" }`, `{ type: "tool", name: "get_weather" }`, `{ type: "none" }`. Tests assertean efecto estructural de cada modo
  - `05-parallel-tools` — prompt que requiere weather de dos ciudades simultáneas (e.g. "clima en Buenos Aires Y Tokyo") → response con múltiples `tool_use` blocks; todos los `tool_result` van en un único mensaje user
- **`calculate` tool schema**: `{ operation: "add" | "subtract" | "multiply" | "divide" (enum), a: number, b: number }`. Enum explícito — enseña JSON Schema enums y evita evaluar expresiones arbitrarias (safety).
- **`get_weather` tool schema**: `{ location: string, unit?: "celsius" | "fahrenheit" }`.
- **`es/exercise.md` + `en/exercise.md`** para los 5 ejercicios desde el inicio (bilingüe día 1)
- **`meta.json`** por ejercicio con `track: "03-tool-use"` y `locales: ["es", "en"]`
- **Confirmado — no se necesita update a `aidev list`**: `code/packages/cli/src/commands/list.ts` agrupa dinámicamente por `trackSlug` leyendo `byTrack` map; `03-tool-use` aparecerá bajo su propio header automáticamente al agregar ejercicios con ese `track` en `meta.json`

## Scope (out)

- **RAG, agents, MCP, computer use** — tracks futuros, SDDs separados
- **Files API, text editor tool, bash tool, built-in tools** — fuera de alcance; este track cubre solo client/user-defined tools
- **Caching integration con tool use** — ya está cubierto en `02-caching/05-caching-with-tools`; no duplicar
- **`disable_parallel_tool_use`** como TODO explícito en `05` — se menciona en la sección "Concepto extra" del `exercise.md` pero no es requerido ni testeado. Mantiene `05` enfocado en **observar** parallel tool use, no en configurarlo away
- **Cambios a `harness.ts`** — la exploración confirmó zero gaps; `isMessage()` ya captura `tool_use` blocks, back-to-back calls generan entradas separadas en `calls[]`
- **Cambios a `cost.ts`** — tool def tokens cuentan como input regular; `estimateCost()` ya los maneja correctamente
- **Fixtures compartidos** — schemas chicos, inline en cada solution
- **Modelos beyond Haiku 4.5** — todo el track usa `claude-haiku-4-5-20251001`
- **Track-level README**

## Key decisions

1. **Modelo default del track: `claude-haiku-4-5-20251001`** — coherente con la política bootcamp-wide de Haiku (matches Foundations + 02-caching). Parallel tool use y todos los `tool_choice` modes están GA en Haiku 4.5.
2. **Domain: weather + calculator** — ejemplo canónico de la docs oficial de Anthropic. Familiar, auditable, cost-free de implementar localmente.
3. **`calculate` con schema de operación como enum** (`"add" | "subtract" | "multiply" | "divide"`) más `a: number, b: number` — NO expression strings. Razones: (1) safety (no evaluar expresiones arbitrarias), (2) enseña JSON Schema enums — concepto reutilizable para todos los tool schemas que vengan.
4. **Ejercicio 04 como un solo `run()` con 4 llamadas back-to-back** — una por `tool_choice` mode. `result.calls.length === 4`. Tests assertean estructura por-llamada. Ventajas: (a) un único `exercise.md` cubre los 4 modos comparativamente, (b) costo controlado (~$0.0020/run), (c) aprovecha el harness sin cambios.
5. **`disable_parallel_tool_use` solo como "Concepto extra"** en `05/exercise.md` — no TODO ni assertion. Mantiene el foco del ejercicio en **observar** parallel tool use (capability nativa de Claude 4+) en lugar de en configuraciones anti-paralelo.
6. **Bilingüe `es`/`en` desde día uno** — misma barra que Foundations y Caching.
7. **Sin harness changes** (confirmado por exploración): `isMessage()` captura `response.content` completo incluyendo `tool_use` blocks; back-to-back `messages.create` genera entradas separadas en `calls[]`; el test runner puede assertear `calls[i].response.stop_reason`, `calls[i].response.content[j].type === "tool_use"`, etc.
8. **Sin `cost.ts` changes** (confirmado por exploración): tool definitions cuentan como input tokens regulares vía `estimateCost()` existente.
9. **Sin fixtures compartidos**: schemas de tools son <150 tokens, inline en cada `solution.ts` como constantes locales. No hay directorio `fixtures/` bajo `03-tool-use/`.
10. **Ordering rationale**: 01 (definir tool + leer respuesta) → 02 (cerrar el loop) → 03 (elegir entre varios) → 04 (controlar el comportamiento) → 05 (observar paralelismo). Cada ejercicio agrega exactamente un concepto atómico — filosofía Rustlings.
11. **Costo total del track ~$0.040** (5 ejercicios × ~1 verify + 1 run por learner) — dentro del budget bootcamp-wide de ~$2 end-to-end.

## Risks & mitigations

- **Riesgo — parallel tool use es model-nondeterministic**: Claude puede decidir llamar tools en serie aunque el prompt sugiera paralelo. Flaky tests si assertean `calls[0].response.content.filter(t => t.type === "tool_use").length === 2`.
  - **Mitigación**: (a) prompt engineereado agresivamente para elicitar paralelo (e.g. "Necesito el clima ACTUAL en Buenos Aires Y Tokyo simultáneamente para comparar"), (b) tests assertean `>= 1` `tool_use` block (range flake-safe, no hard equality), (c) el ejercicio documenta que paralelo es un hint del modelo, no garantía — parte del aprendizaje.
- **Riesgo — `stop_reason` flake entre `"tool_use"` y `"end_turn"` bajo `tool_choice: { type: "none" }`**: el modelo a veces respeta `none` con `end_turn`, a veces se confunde.
  - **Mitigación**: en lugar de assertear `stop_reason === "end_turn"`, assertear que **ningún `content` block tiene `type === "tool_use"`**. Es el invariante real del feature ("Claude no puede usar tools"), independiente del stop_reason exacto.
- **Riesgo — model rename / deprecation** (`claude-haiku-4-5-20251001` cambia): rompe todos los ejercicios del track.
  - **Mitigación**: cada `meta.json` declara `valid_until`; weekly health-check CI detecta drift de model IDs y links canónicos. Convención bootcamp-wide ya en place.
- **Riesgo — learner ejecuta `05` y Claude no llama tools en paralelo una vez**: percepción de test falso-positivo.
  - **Mitigación**: `exercise.md` de `05` explica explícitamente que la capability es no-determinística y que el test está calibrado para aceptar >=1 tool_use. Re-run usualmente produce paralelo.

## Success criteria

- Los 5 ejercicios pasan `aidev verify <id> --solution` contra el API real
- `bun test` desde `code/` permanece verde (existing + nuevos)
- Costo total del track para el learner (verify + run de los 5) < $0.05 medido
- Cada ejercicio enseña **exactamente un concepto atómico** (verificable leyendo el `exercise.md` de cada uno) — filosofía Rustlings
- Bilingüe completo: 10 `exercise.md` totales (5 `es` + 5 `en`), sin locale fallback en producción
- Weekly health-check CI pasa después del merge (links canónicos, model IDs)
- `aidev list` muestra `▸ 03-tool-use` como header auto-agrupado con los 5 ejercicios, sin tocar código de CLI

## Dependencies

- **Ninguna dependencia de tareas previas**: Foundations + Caching ya están completos. Este track no depende de `cost.ts` updates ni de nuevas convenciones de contrato.
- **Sin nuevos paquetes**: `@anthropic-ai/sdk ^0.40` ya soporta tool use completo incluyendo parallel y todos los `tool_choice` modes.
- **Sin cambios a `harness.ts` ni a `cost.ts`**: confirmado por la exploración.

## Next steps

1. **Specs + design en paralelo** (via orchestrator):
   - `sdd-spec` → delta spec: nuevo capability `tool-use-track` con requirements por ejercicio (structural assertions que los tests deben expresar)
   - `sdd-design` → ADRs (dominio weather+calculator, `calculate` enum vs expression, `04` como single-run 4-calls, parallel assertion strategy); component diagram (track → ejercicios → harness existente)
2. **Tasks breakdown** (`sdd-tasks`) — checklist de fases: ejercicios 01→05 en orden, cada uno con sus 6 archivos del contract + `es/en`
3. **Apply** (`sdd-apply`) por batches siguiendo el task checklist (strict TDD)
4. **Verify + archive**

---

## skill_resolution: injected
