# Proposal: docs-followups-issues-8-9-10

**Status**: proposed
**Change name**: `docs-followups-issues-8-9-10`
**Date**: 2026-04-15
**Stakeholder**: Juan Carlos Yovera Cruz

## Intent

Cerrar los 3 follow-ups abiertos por el verify del track `03-tool-use`: normalizar host canónico de docs, y agregar dos notas explicativas en los ejercicios `04-tool-choice` y `05-parallel-tools`.

## Problem

Tres inconsistencias surgidas durante el verify del tool-use track:

1. **#8 — URL host drift**: Foundations usa `platform.claude.com/...` (convención vieja); 02-caching y 03-tool-use usan `docs.claude.com/...` (convención nueva). CLAUDE.md + `.atl/skill-registry.md` mencionan ambas. Contribuidores no tienen claridad sobre cuál es la canónica.
2. **#9 — Decisión de assertion no documentada**: el ejercicio `04-tool-choice` assertea sobre el campo `tool_choice` del request y sobre la ausencia de bloques `tool_use` en el response (en vez de assertear `stop_reason === "end_turn"`). La razón — `stop_reason` es flake-prone bajo `tool_choice: none` — no está documentada en `exercise.md`, solo en el design archivado.
3. **#10 — Estrategia de prompt oculta**: el ejercicio `05-parallel-tools` requiere un prompt explícito ("call the tool twice, in parallel") porque Haiku 4.5 no emite paralelo de forma confiable sin esa guía. Learners que modifiquen el prompt con uno más natural pueden ver el test fallar sin entender por qué.

## Proposed solution

Un único SDD change bundle con 3 deltas pequeños, shippeado en 3 commits (uno por issue para que `Closes #N` los cierre automáticamente).

### Delta 1 — Normalización de host (#8)
- Reemplazar `platform.claude.com` → `docs.claude.com` en:
  - `CLAUDE.md`, `CONTRIBUTING.md`, `.atl/skill-registry.md`
  - Todos los `code/packages/exercises/01-foundations/*/{starter.ts, es/exercise.md, en/exercise.md}`
- NO tocar `openspec/changes/archive/**` — los artefactos archivados son historia congelada.
- Verificar que `docs.claude.com/en/...` resuelve para al menos 2 de las URLs migradas (spot check).

### Delta 2 — Doc en 04-tool-choice (#9)
Agregar párrafo a `es/exercise.md` + `en/exercise.md` del `04-tool-choice` en la sección "Qué validan los tests" o "Concepto extra", explicando:
- Por qué assertear sobre `request.tool_choice` (shape correctness sin depender del modelo).
- Por qué `tool_choice: none` se valida por ausencia de `tool_use` blocks en vez de `stop_reason === "end_turn"` (ese campo es flake-prone).

### Delta 3 — Prompt strategy en 05-parallel-tools (#10)
Agregar al "Concepto extra" de `es/exercise.md` + `en/exercise.md` del `05-parallel-tools`:
- Observación empírica: Haiku 4.5 no paraleliza confiablemente sin prompt explícito.
- Ejemplo del prompt que sí funciona ("call the tool twice, once per city, in parallel").
- Nota de que los tests aceptan `>= 1` tool_use blocks para tolerar no-determinismo.

## Scope (in)

- 3 deltas atómicos arriba.
- 3 commits con `Closes #N` cada uno.
- Archivo del SDD folder bajo `openspec/changes/archive/2026-04-15-docs-followups-issues-8-9-10/` cuando cierre.
- Engram topic keys mirror (obligatorio según instrucción del usuario): `sdd/docs-followups-issues-8-9-10/{proposal, spec, archive-report}`.

## Scope (out)

- No tocar archive folders existentes — son inmutables.
- No cambios a harness, cost.ts, CLI code, o tests.
- No crear nuevos ejercicios ni tracks.

## Key decisions

1. **Host canónico = `docs.claude.com`** (vs `platform.claude.com`). Razón: los 2 tracks más recientes (02-caching, 03-tool-use) ya lo usan — alinear Foundations cierra el drift.
2. **Bundle vs 3 changes separados**: bundle. Los 3 son docs-only y comparten contexto (post-tool-use cleanup). Un solo archive folder reduce ceremonia.
3. **Commits separados**: uno por issue para que `Closes #N` sea inequívoco y GitHub cierre cada issue automáticamente al pushear a main.
4. **No SDD design phase**: docs-only change sin decisiones arquitectónicas. Proposal + spec son suficientes; tasks + design se omiten.
5. **Verify inline**: grep post-fix para confirmar 0 referencias `platform.claude.com` en código live + render visual de los `exercise.md` editados. No se lanza un sub-agent de verify.

## Risks & mitigations

- **Riesgo**: `docs.claude.com` puede ser un mirror/alias y romperse en el futuro. **Mitigación**: el bootcamp ya tiene health-check semanal — si las URLs dejan de resolver, lo detectamos.
- **Riesgo**: perderse algún archivo con `platform.claude.com`. **Mitigación**: `rg "platform\.claude\.com" code/ CLAUDE.md CONTRIBUTING.md .atl/` post-fix debe devolver 0 líneas.

## Success criteria

- `rg "platform\.claude\.com" code/ CLAUDE.md CONTRIBUTING.md .atl/` → 0 hits.
- `docs.claude.com/en/api/messages` y `docs.claude.com/en/docs/build-with-claude/prompt-caching` resuelven (spot check via `gh api` o browser no requerido; existing exercises ya apuntaban a estos paths).
- Issues #8, #9, #10 cerrados automáticamente por `Closes #N` al pushear.
- `bunx tsc --noEmit` clean (aunque el cambio es solo docs, confirmar que no rompimos un starter.ts).

## Dependencies

Ninguna. Los 3 deltas son independientes.

## Next steps

1. Escribir `spec.md` (este cambio) con deltas verificables por issue.
2. Save ambos a engram: `sdd/docs-followups-issues-8-9-10/proposal` y `.../spec`.
3. Aplicar los 3 deltas con commits separados + `Closes #N`.
4. Archive folder + archive-report, save to engram.
5. Push.
