# Proposal: add-agents-track

**Change:** `add-agents-track`
**Phase:** proposal
**Date:** 2026-04-15
**Artifact store:** hybrid (engram + openspec)

---

## Intent

Agregar el quinto track del bootcamp — `05-agents` — con 5 ejercicios progresivos que enseñan la anatomía del agent loop: think → act → observe, con estado explícito, condiciones de parada en capas, planificación multi-paso y self-correction sobre errores de tools. El track llega post-RAG porque un senior dev que ya sabe retrieval + tool use necesita el pegamento — iteración con estado — para construir sistemas multi-turno. Es la skill faltante antes de MCP (que es "agents que hablan con servicios externos vía protocolo").

## Problem

Después de Foundations + Caching + Tool use + RAG, un senior dev sabe llamar al API, cachear prompts, cerrar un único tool loop y recuperar conocimiento. Lo que **no sabe** es:

- Cómo estructurar un loop iterativo (`while stop_reason !== "end_turn"`) donde el modelo decide cuántos pasos necesita
- Cómo componer **stop conditions en capas** (cap duro de iteraciones, parada natural por `end_turn`, predicado de objetivo opcional) y por qué cada capa es necesaria
- Cómo mantener **estado conversacional** (historial de `messages`) a través de múltiples turnos sin explotar tokens
- Cómo orquestar un **plan multi-paso** donde el modelo usa el resultado del tool N como input del tool N+1
- Cómo implementar **self-correction** — que el agente vea `{ error: ... }` en un `tool_result` y pruebe una estrategia distinta en lugar de retry ciego

Sin agents, cualquier MCP server, assistant vertical o workflow con retrieval + tools queda como one-shot. Agents es el primitivo iterativo que desbloquea todo lo demás.

## Proposed solution

Nuevo track `code/packages/exercises/05-agents/` con **5 ejercicios progresivos**, un **fixture compartido** `research-tools.ts`, dominio de **research-assistant** sobre el corpus `04-rag/fixtures/docs-chunks.ts` existente, implementaciones **DIY del loop** (no Agent SDK) y **cero cambios a runtime** (harness, CLI, `cost.ts` intactos). Modelo único: **Haiku 4.5** (`claude-haiku-4-5-20251001`). Bilingüe `es`/`en` desde día uno.

Detalles API (stop_reason semantics, tool_result shape, field notes sobre DOCS_CHUNKS) están documentados en `sdd/add-agents-track/explore` — no se duplican acá.

## Scope (in)

- **5 ejercicios** en `code/packages/exercises/05-agents/`:
  - `01-agent-loop` — anatomía think→act→observe, el loop mínimo con un solo tool y `maxIterations`
  - `02-stop-conditions` — paradas en capas: hard cap + `stop_reason === "end_turn"` + `goalPredicate` opcional
  - `03-state-management` — cómo crece `messages[]` por iteración, cuándo trimmear, invariantes del historial
  - `04-multi-step-plan` — agente que encadena `search_docs` → `read_chunk` → síntesis sobre múltiples chunks
  - `05-self-correction` — el agente recibe `{ error: "Chunk not found" }` y recupera probando un approach diferente
- **Fixture compartido**: `code/packages/exercises/05-agents/fixtures/research-tools.ts` exportando `SEARCH_DOCS_TOOL`, `READ_CHUNK_TOOL`, `executeSearchDocs`, `executeReadChunk`, `executeTool`. Importa `DOCS_CHUNKS` desde `../../04-rag/fixtures/docs-chunks.ts` (campos: `.text`, `.metadata.topic`, `.id`)
- **Search implementation**: keyword substring match sobre `.text` + `.metadata.topic`. Sin llamadas a Voyage — el track enseña mecánica del loop, no retrieval
- **Bilingüe `es/exercise.md` + `en/exercise.md`** para los 5 ejercicios desde el inicio (10 archivos totales)
- **`meta.json`** por ejercicio con `track: "05-agents"`, `valid_until: "2026-10-15"`, `locales: ["es", "en"]`, y `requires`: 01 → `["01-first-call"]`, 02 → `["01-agent-loop"]`, 03 → `["02-stop-conditions"]`, 04 → `["03-state-management"]`, 05 → `["04-multi-step-plan"]`
- **Docs comment header** en cada `starter.ts` y `solution.ts` apuntando a `docs.claude.com/en/docs/agents-and-tools/tool-use/...`

## Scope (out)

- **MCP servers** — track siguiente, SDD separado
- **Agent SDK beta tool runner** (`client.beta.messages.toolRunner()`) como camino pedagógico principal — se menciona solo como "Concepto extra" al final de `05-self-correction`. La razón es filosófica: el bootcamp enseña DIY para que el learner **vea** cada iteración, human-in-the-loop, custom logging y ejecución condicional — exactamente lo que la doc de Anthropic recomienda cuando el loop manual es el right choice
- **Subagents / multi-agent orchestration** — decisión explícita del user ("5 ejercicios"), futuro drop
- **Computer use / agent web-research real** — fuera de alcance
- **Búsqueda semántica en los tools** — substring keyword only; track 04 ya cubrió embeddings
- **External memory stores** (SQLite, Redis, vector DBs) — estado es TS puro in-process
- **Cambios a `harness.ts`, `cost.ts`, CLI (`aidev`)** — listado dinámico por `trackSlug` hace que `05-agents` aparezca solo
- **Nuevos paquetes npm** — cero dependencias nuevas

## Key decisions

1. **5 ejercicios fijos** con concept-per-exercise: agent-loop, stop-conditions, state-management, multi-step-plan, self-correction. Sin 6to ejercicio en este drop.
2. **DIY loop, NO Agent SDK**. El learner escribe el `while` explícitamente; ve cada `stop_reason`, cada append a `messages`, cada `tool_result`. Alineado con la doc de Anthropic: el loop manual es el right choice cuando necesitás human-in-the-loop, custom logging o ejecución condicional — que es precisamente lo que el bootcamp enseña. `toolRunner()` se menciona como *Concepto extra* en 05 para que el learner sepa que existe.
3. **Fixture compartido** `research-tools.ts` exportando los 2 tool specs + ejecutores + dispatcher `executeTool`. Reduce duplicación y fija un patrón de autoría de tools.
4. **Cross-track fixture reuse**: `DOCS_CHUNKS` se importa desde `04-rag/fixtures/docs-chunks.ts`. **Nueva convención arquitectónica** del repo — fixtures pueden cruzar track boundaries cuando el dominio lo justifica. Pin explícito a `.text` / `.metadata.topic` / `.id` (field note del explore: los items usan `.text`, no `.content`).
5. **Search implementation: keyword substring** sobre `text` + `metadata.topic`. Zero API cost para search; sin `VOYAGE_API_KEY`; el track queda enfocado en mecánica del loop.
6. **Stop conditions en capas**: `maxIterations` hard cap (siempre) + `stop_reason === "end_turn"` (parada natural) + `goalPredicate(state)` opcional (parada custom). Se enseñan acumulativamente a lo largo de 01→02.
7. **Modelo único: `claude-haiku-4-5-20251001`** — coherente con cost discipline bootcamp-wide. Estimación de costo total del track: ~$0.03 por learner.
8. **Bilingüe `es`/`en` desde día uno** — 10 `exercise.md` al cierre del track.
9. **Tests con aserciones de rango, nunca conteos exactos**: `calls.length >= 1 && calls.length <= 10`. Haiku puede tomar 2-8 iteraciones para la misma query — los tests deben tolerar no-determinismo.
10. **`maxIterations: 10` en TODOS los tests** como cap de seguridad que bounda el worst-case cost incluso si el agente entra en loop.
11. **System prompt per-exercise, no shared**: cada `solution.ts` exhibe su propio prompt (el prompt engineering también es contenido del track).
12. **Solutions usan el shared fixture**: cada `solution.ts` importa los tools de `research-tools.ts` — reduce duplicación y refuerza el patrón.
13. **Zero runtime changes**: harness, `cost.ts`, `aidev` CLI intactos. `list` agrupa por `trackSlug` dinámicamente y `05-agents` aparece automáticamente.

## Risks & mitigations

- **Riesgo — flake por terminación del loop**: Haiku puede tomar entre 2 y 8 iteraciones para la misma query debido a no-determinismo del modelo; assertions de conteo exacto fallarán esporádicamente.
  - **Mitigación**: aserciones de rango (`calls.length >= 1 && calls.length <= 10`) y `maxIterations: 10` como cap duro en cada test. Nunca assertear conteo exacto.
- **Riesgo — self-correction no confiable en 05**: el agente debe ver `{ error: "Chunk not found" }` en un `tool_result` y **cambiar de estrategia**, no reintentar la misma call.
  - **Mitigación**: system prompt fuerte en `solution.ts` del 05 con instrucción explícita: "If any tool returns `{ error }`, try a DIFFERENT approach (different id, different query) rather than retrying the same call." El test assertea que el segundo call tiene inputs distintos al primero.
- **Riesgo — crecimiento de tokens en loops largos**: `messages[]` acumula cada turno (request + response + tool_result). En casos degenerados, costo crece O(n²) con la longitud del historial.
  - **Mitigación**: `maxIterations: 10` en el 04 (multi-step-plan) y en los tests garantiza O(n) bounded worst-case. Si un learner dispara un loop infinito, el cap lo corta.
- **Riesgo — acoplamiento cross-track (fixture coupling)**: si `04-rag/fixtures/docs-chunks.ts` renombra `.text` → `.content` o cambia la shape de `.metadata`, este track se rompe silenciosamente.
  - **Mitigación**: (a) pin explícito a `.text` / `.metadata.topic` / `.id` documentado en el spec, (b) los tests de `05-agents` fallan ruidosamente si la shape cambia, actuando como gate de facto, (c) considerar un test unit minimal en `research-tools.ts` que afirme shape del import.

## Success criteria

- Los 5 ejercicios pasan `aidev verify <id> --solution` contra el API real de Anthropic
- `bun test` desde `code/` permanece verde (existing + nuevos)
- Costo total del track por learner < $0.05 (estimación ~$0.03 con Haiku y `maxIterations: 10`)
- `aidev list` muestra `▸ 05-agents` auto-agrupado con los 5 ejercicios, sin tocar CLI
- Weekly health-check CI pasa con los secrets existentes (solo `ANTHROPIC_API_KEY`, sin secret nuevo)
- Cada ejercicio enseña **exactamente un concepto atómico** del agent loop (verificable leyendo el `exercise.md`)
- Bilingüe completo: 10 `exercise.md` (5 `es` + 5 `en`)

## Dependencies

- `code/packages/exercises/04-rag/fixtures/docs-chunks.ts` debe existir y exportar items con `.text`, `.metadata.topic`, `.id`. **Confirmado en commit `2f01664`** durante la fase de exploración.
- No hay otras dependencias. Cero nuevos paquetes npm.

## Next steps

1. **Specs + design en paralelo** (via orchestrator):
   - `sdd-spec` → delta spec: nueva capability `agents-track` con requirements por ejercicio (loop invariants, stop-condition semantics, state management, tool contracts, self-correction observable)
   - `sdd-design` → ADRs (DIY loop vs Agent SDK, keyword vs semantic search, cross-track fixture reuse, stop-condition layering, system-prompt-per-exercise)
2. **Tasks breakdown** (`sdd-tasks`) — checklist por ejercicio (01→05) + shared fixture + cross-track import test
3. **Apply** (`sdd-apply`) por batches (Strict TDD)
4. **Verify + archive**

---

## skill_resolution: injected
