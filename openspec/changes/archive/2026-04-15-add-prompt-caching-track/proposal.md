# Proposal: add-prompt-caching-track

**Change:** `add-prompt-caching-track`
**Phase:** proposal
**Date:** 2026-04-14
**Artifact store:** hybrid (engram + openspec)

---

## Intent

Agregar el segundo track del bootcamp — `02-caching` — con 5 ejercicios progresivos que enseñan prompt caching de Anthropic: desde el primer `cache_control` hasta un loop conversacional con tool use y multi-breakpoints. Este track es el puente natural entre Foundations (pedir respuestas) y los tracks futuros (tool use, RAG, agents), porque caching es la optimización que hace viables los prompts largos y repetitivos que esos tracks requieren.

## Problem

Hoy el bootcamp enseña cómo hacer llamadas a Claude pero no cómo hacerlas **económicamente sostenibles**. Un senior dev que sale de Foundations sabe elegir un modelo y leer `usage`, pero no sabe:

- Cómo reducir costos 90% en prompts repetitivos vía `cache_control`
- Qué tokens cuentan como cache write (1.25×/2×) vs cache read (0.1×)
- Cuándo un TTL de 1h amortiza sobre muchas reads vs 5m
- Cómo combinar múltiples breakpoints (system + tools + history) sin pasarse del límite de 4
- Cómo se comporta caching en loops conversacionales con tool use — el patrón real de producción

Sin este track, cualquier aplicación real que construyan va a ser 5–10× más cara de lo necesario. Además, el comando `aidev run` hoy reporta costos incorrectos para prompts cacheados (`cost.ts` ignora los campos `cache_*`), lo que silenciosamente enseña números equivocados.

## Proposed solution

Nuevo track `code/packages/exercises/02-caching/` con **5 ejercicios progresivos**, un **fixture compartido** de system prompt (>4,096 tokens para superar el threshold de Haiku 4.5), y un **update previo a `cost.ts`** que agrega los campos de caching al tipo `Usage` y al cálculo de `estimateCost()`. Bilingüe `es`/`en` desde el día uno — misma barra que Foundations.

Detalles API (parámetro `cache_control`, shape de `usage`, thresholds por modelo, pricing multipliers, límites de breakpoints) están documentados en `sdd/add-prompt-caching-track/explore` — no se duplican acá.

## Scope (in)

- **5 ejercicios** en `code/packages/exercises/02-caching/`:
  - `01-basic-caching` — primer `cache_control: ephemeral`; verificar `cache_creation_input_tokens > 0` y hit en segunda llamada
  - `02-cache-hit-metrics` — leer `usage` y calcular savings %; retornar objeto con `effective_cost_usd`
  - `03-multi-breakpoint` — 3 breakpoints (system + tools + history); observar qué tokens van a qué sección
  - `04-ttl-extended` — `ttl: "1h"` + cálculo de break-even vs `5m`
  - `05-caching-with-tools` — loop conversacional de 3 turnos con tool use + caching multi-breakpoint (escenario producción)
- **Fixture compartido**: `code/packages/exercises/02-caching/fixtures/long-system-prompt.ts` — string exportada (~4,200–4,500 tokens). Nueva convención de track (no modifica el exercise contract; es un asset del track).
- **Update a `cost.ts`** (tarea pre-ejercicio con su propio `cost.test.ts`):
  - Extender `Usage` con `cache_creation_input_tokens?: number` y `cache_read_input_tokens?: number`
  - Extender `estimateCost()`: write 5m = 1.25×, write 1h = 2.0×, read = 0.1× sobre el precio base input
  - Actualizar `SdkMessage.usage` en `render.ts` si aplica
- **`es/exercise.md` + `en/exercise.md`** para los 5 ejercicios desde el inicio (bilingüe día 1)
- **`meta.json`** por ejercicio con `track: "02-caching"` y `locales: ["es", "en"]`
- **NO** se necesita track-level README: el directorio `02-caching/` se agrupa automáticamente en `aidev list` vía `trackSlug` (ver `code/packages/cli/src/exercises.ts` y `commands/list.ts` — grouping dinámico, sin tabla hardcodeada)
- **NO** se necesita update a `aidev list`: grouping es por `trackSlug`; `02-caching` aparecerá bajo su propio header automáticamente

## Scope (out)

- **Tool use track** como track propio (`03-tool-use`) — SDD separado; este track solo usa tool use como vehículo en `05-caching-with-tools`
- **RAG, agents, MCP** — tracks futuros, SDDs separados
- **Batch API caching** y **vision caching** — fuera de alcance (otros formatos, otros tradeoffs)
- **Cambios a `aidev run`** más allá de que renderice correctamente los nuevos campos `cache_*` via el update a `cost.ts`
- **Modelos beyond Haiku 4.5** — todos los ejercicios del track usan Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **Track-level README** — el README del bootcamp global cubre esto; un README por track agregaría mantenimiento sin valor

## Key decisions

1. **Modelo default del track: `claude-haiku-4-5-20251001`** — coherente con la política bootcamp-wide de Haiku por disciplina de costos. Threshold 4,096 tokens; resolvemos con fixture largo.
2. **Fixture compartido en `02-caching/fixtures/long-system-prompt.ts`** — exportado como constante TypeScript, importable por los 5 ejercicios. Nueva convención específica del track; no altera el exercise contract (los archivos requeridos del contract siguen siendo los mismos en cada ejercicio). Target: ~4,200–4,500 tokens (margen seguro sobre 4,096).
3. **`cost.ts` update como tarea explícita previa**, con `cost.test.ts` extendido — precede a cualquier ejercicio del track. Motivación: bloquea la experiencia de `aidev run` si no se hace antes, y es un cambio lo suficientemente contenido como para no mezclarlo con la lógica de ejercicios.
4. **Pricing multipliers hardcoded**: write 5m = 1.25×, write 1h = 2.0×, read = 0.1× sobre el precio base input del modelo. Son valores API-wide, no por modelo.
5. **Bilingüe `es`/`en` desde día uno** — misma barra que Foundations. No hay "primero `es`, luego `en`": sale completo o no sale.
6. **4 breakpoints como cap duro** — el ejercicio `03-multi-breakpoint` usa 3 para dejar margen y mostrar que la suma automática (toolDef + system + turn) puede empujar a 4. Esto es parte del aprendizaje.
7. **Sin beta headers** — prompt caching es GA en Claude API. Ningún ejercicio debe agregar `anthropic-beta` para esto.
8. **Costo total del track ~$0.026** — incluido en el presupuesto bootcamp-wide de ~$2 end-to-end (Foundations ~$0.01 + Caching ~$0.026 + tracks futuros). Dentro del budget.
9. **Harness sin cambios** — el `Message` del SDK ya incluye `cache_creation_input_tokens` y `cache_read_input_tokens` en `usage`; el harness los captura sin tocar nada. Los tests assertean directamente sobre `call.response.usage`.
10. **Ordering rationale**: 01 (crear cache) → 02 (medirlo) → 03 (escalarlo con breakpoints) → 04 (optimizar TTL) → 05 (integrarlo con tools, escenario producción). Cada ejercicio agrega exactamente un concepto.

## Risks & mitigations

- **Riesgo — threshold de Haiku 4.5 cambia en el futuro**: Anthropic puede ajustar el min token threshold por modelo.
  - **Mitigación**: cada ejercicio declara `valid_until` en `meta.json` (contrato existente). El `cost.test.ts` fallará si los multiplicadores cambian. El health-check CI semanal detecta drift.
- **Riesgo — Anthropic agrega nuevos variants de `cache_control`** (nuevos tipos además de `ephemeral`, nuevos TTLs): podrían hacer obsoletos los ejercicios.
  - **Mitigación**: exercise contract requiere `// Docs:` header con links canónicos (platform.claude.com). El health-check detecta 404s en los links. Re-versionar via `meta.json.version` cuando cambie.
- **Riesgo — cache ephemeral expira a 5 minutos → tests flaky** si la segunda llamada de un ejercicio corre tarde.
  - **Mitigación**: los tests hacen las llamadas back-to-back dentro del mismo `run()`, ms de diferencia. El budget de cada ejercicio es < 5min end-to-end. Ningún ejercicio depende de cross-process caching.
- **Riesgo — fixture de 4,500 tokens inflado a capricho**: si es texto lorem-ipsum-ish se siente barato.
  - **Mitigación**: el fixture es un documento técnico real y reutilizable (ej: "REST API design best practices") — tiene valor pedagógico propio y se puede referenciar desde el `exercise.md`.

## Success criteria

- Los 5 ejercicios pasan `aidev verify <id> --solution` contra el API real
- `bun test` desde `code/` permanece verde incluyendo los nuevos casos en `cost.test.ts`
- Weekly health-check CI pasa después del merge (links, thresholds, model IDs)
- Cada ejercicio enseña **exactamente un concepto atómico** (verificable leyendo el `exercise.md` de cada uno)
- Costo total del track para el learner (verify + run de los 5) < $0.05 medido, <$0.03 target
- Bilingüe completo: 10 `exercise.md` totales (5 `es` + 5 `en`), sin locale fallback en producción

## Dependencies

- **`cost.ts` update es prerequisito del ejercicio `02-cache-hit-metrics`** (el ejercicio enseña a usar la función actualizada). Debe ir antes en el task breakdown.
- **Fixture `long-system-prompt.ts` es prerequisito de los 5 ejercicios**. Debe crearse en el primer batch de apply.
- **Sin dependencias externas nuevas**: `@anthropic-ai/sdk ^0.40` ya soporta los campos. No hay nuevos paquetes.

## Next steps

1. **Specs + design en paralelo** (via orchestrator):
   - `sdd-spec` → delta specs: nuevo capability `prompt-caching-track`; update al capability `cost-accounting` para los campos cache
   - `sdd-design` → ADRs (fixture location, cost.ts API extension, ordering rationale); component diagram (track → fixture → ejercicios → cost.ts)
2. **Tasks breakdown** (`sdd-tasks`) — checklist de fases: (1) `cost.ts` + test, (2) fixture, (3) ejercicios 01→05 en orden, cada uno con sus 6 archivos del contract + `es/en`, (4) verify integration
3. **Apply** (`sdd-apply`) por batches siguiendo el task checklist
4. **Verify + archive**

---

## skill_resolution: injected
