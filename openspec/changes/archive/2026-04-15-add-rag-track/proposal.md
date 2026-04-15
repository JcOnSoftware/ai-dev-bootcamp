# Proposal: add-rag-track

**Change:** `add-rag-track`
**Phase:** proposal
**Date:** 2026-04-15
**Artifact store:** hybrid (engram + openspec)

---

## Intent

Agregar el cuarto track del bootcamp — `04-rag` — con 5 ejercicios progresivos que enseñan RAG end-to-end: desde la matemática de embeddings y similitud coseno hasta un pipeline de recuperación con citas y grounding. Post-tool-use es el orden natural: un senior dev que ya sabe cerrar el tool loop necesita, para casos de uso no triviales, darle a Claude conocimiento que el modelo no tiene — y hacerlo sin rellenar la context window con documentos enteros. RAG es ese primitivo faltante.

## Problem

Hoy, después de completar Foundations + Caching + Tool use, un senior dev sabe llamar al API, cachear prompts y cerrar el loop con tools — pero no sabe:

- Cómo convertir texto en vectores y por qué los embeddings están L2-normalizados (dot product == cosine similarity)
- Cómo rankear un corpus contra una query y por qué `input_type: "query"` vs `"document"` **no es opcional** en Voyage
- Qué estrategia de chunking elegir (fixed / sentence / paragraph) y cómo medir su impacto en retrieval
- Cómo ensamblar un pipeline retrieve-then-generate con Haiku
- Cómo forzar citations estructuradas que aten cada claim a un `chunkId` del corpus (grounding)

Sin RAG, cualquier agent, assistant vertical, o integración MCP que intenten construir va a depender de stuffing context windows completas — caro, frágil y con el límite duro del context window. RAG es el skill que desbloquea aplicaciones con conocimiento propio.

## Proposed solution

Nuevo track `code/packages/exercises/04-rag/` con **5 ejercicios progresivos**, un **fixture compartido** de ~15 chunks derivados de la docs de Anthropic, y **cero cambios a runtime** (harness, CLI, `cost.ts` intactos). Embeddings vía **Voyage AI** (canonical endorsement de Anthropic) usando **raw `fetch`** — sin `voyageai` npm dep. Vector store **in-memory** (array de objetos). Auth vía **`VOYAGE_API_KEY`** separado de `ANTHROPIC_API_KEY`. Generación (04, 05) con **Haiku 4.5**. Bilingüe `es`/`en` desde el día uno.

Detalles API (endpoint shape, modelos, free tier, harness gap, helper contract) están documentados en `sdd/add-rag-track/explore` — no se duplican acá.

## Scope (in)

- **5 ejercicios** en `code/packages/exercises/04-rag/`:
  - `01-embeddings-basics` — llamar Voyage `/v1/embeddings` con raw `fetch`, recibir `number[]` de 1024 dims, implementar `cosineSimilarity()`, observar que embeddings L2-normalizados convierten dot product en cosine (matemática fundacional)
  - `02-vector-search` — embeber un corpus con `input_type: "document"`, embeber una query con `input_type: "query"`, rankear y devolver top-K por similitud coseno
  - `03-chunking-strategies` — implementar 3 estrategias (`fixed` / `sentence` / `paragraph`), medir cómo el chunking afecta recall de retrieval sobre el corpus compartido
  - `04-retrieval-pipeline` — pipeline end-to-end: retrieve top-K con Voyage + generate answer con Haiku 4.5 inyectando los chunks como contexto
  - `05-citations-grounding` — generar respuestas con citations estructuradas (`{ chunkId, quote }[]`) via system prompt + JSON parsing; assertear que cada citation referencia un `chunkId` real del corpus
- **Fixture compartido**: `code/packages/exercises/04-rag/fixtures/docs-chunks.ts` exportando ~15 chunks de ~150-300 tokens parafraseados de docs de Anthropic (tool use, prompt caching, streaming, token counting, RAG overview)
- **Bilingüe `es/exercise.md` + `en/exercise.md`** para los 5 ejercicios desde el inicio
- **`meta.json`** por ejercicio con `track: "04-rag"`, `valid_until: "2026-10-15"` (6 meses), `requires` chain correcto, `locales: ["es", "en"]`
- **Voyage HTTP contract** enseñado vía raw `fetch` con tipos que definimos nosotros — zero new deps
- **Update del README**: instrucciones para setear `VOYAGE_API_KEY` (sign-up link, free tier 200M tokens/mes, comando `export`)

## Scope (out)

- **Agents, MCP servers** — tracks futuros, SDDs separados
- **Hybrid search / re-ranking / BM25** — fuera de alcance del primer drop (decisión explícita del user); posible follow-up
- **External vector DBs** (Pinecone, Weaviate, Qdrant, pgvector) — in-memory only, pedagógicamente más claro
- **OpenAI / Cohere embeddings** — Voyage only (canonical endorsement de Anthropic)
- **Cambios a `harness.ts`** — NO se intercepta Voyage. Tests llaman helpers exportados directamente y assertean sobre shape/semantics (ver Key decision #8)
- **Cambios a `cost.ts`** — NO se extiende. Costo de Voyage se imprime inline en cada ejercicio con la fórmula `(tokens / 1_000_000) * 0.02`; Haiku en 04/05 usa el `estimateCost` existente sin cambios
- **Cambios a CLI (`aidev`)** — `list` agrupa dinámicamente por `trackSlug`, `04-rag` aparece automáticamente sin tocar código
- **Pre-computed embeddings en el fixture** — los ejercicios deben computarlos (parte del aprendizaje)
- **Modelos de embeddings beyond `voyage-3.5-lite`** — todo el track usa ese modelo
- **Track-level README** (instrucciones viven en cada `exercise.md` + root README)

## Key decisions

1. **Embeddings provider: Voyage AI**, modelo `voyage-3.5-lite`, 1024 dims, $0.02/1M tokens. Razones: (a) Anthropic delega embeddings a Voyage en su docs oficial (canonical path), (b) free tier **200M tokens/mes** para `voyage-3.5-lite` → learners pagan **$0** por este track, (c) suficiente calidad para 15 chunks.
2. **HTTP client: raw `fetch`, NO el paquete `voyageai`**. Razones: (a) zero new deps, (b) enseña el HTTP contract directamente (learners ven `input_type`, headers, JSON shape), (c) SDK está pre-1.0 (v0.2.1) — riesgo de drift, (d) `fetch` es native en Bun.
3. **Auth: env var separada `VOYAGE_API_KEY`**. `beforeAll` en cada test guardea **ambos** `ANTHROPIC_API_KEY` y `VOYAGE_API_KEY` (01-03 solo Voyage; 04-05 ambos). README documenta el setup.
4. **Vector store: in-memory JSON** — array de `{ id, content, embedding, metadata }`. Pedagógicamente claro; sin ceremonia de DBs externas; alineado con la filosofía Rustlings (un concepto a la vez).
5. **Corpus fixture compartido**: `code/packages/exercises/04-rag/fixtures/docs-chunks.ts` con ~15 chunks parafraseados de Anthropic docs (tool use, caching, streaming, tokens, RAG overview). Uso parafraseado (fair use) coherente con contenido existente.
6. **`cost.ts` NO se extiende**. Voyage cost se imprime inline con la fórmula directa — es más educativo (learners ven la matemática). Extender `ModelFamily` para pricing input-only agregaría complejidad a un módulo con semántica Anthropic-clean hoy. Haiku en 04/05 usa `estimateCost` existente.
7. **`harness.ts` NO se extiende**. El monkey-patch intercepta solo `Anthropic.Messages.prototype.create/stream` — Voyage calls son invisibles. Extender para interceptar `fetch` sería invasivo y rompería la abstracción Anthropic-focused del harness.
8. **Test strategy sin harness capture**: los tests importan y llaman los helpers exportados (`embed`, `cosineSimilarity`, `search`, `retrieveAndGenerate`, `generateWithCitations`) con inputs conocidos y assertean sobre **shape y semantics** (longitud del vector, rango de cosine ∈ [-1, 1], top-K ordering, chunkId válido en citations). Para 04-05 el harness sí captura la call a Haiku — assertions estructurales normales sobre `result.calls` ahí.
9. **Generation model: `claude-haiku-4-5-20251001`** en ejercicios 04 y 05 — coherente con política bootcamp-wide (Haiku default).
10. **Embeddings L2-normalizados → dot product == cosine similarity**: se enseña explícitamente en `01-embeddings-basics`. Concepto no obvio que cambia cómo pensás el pipeline (podés usar dot product crudo en producción para perf sin perder corrección).
11. **`input_type` es mandatory**: `"document"` para chunks del corpus, `"query"` para queries de retrieval. Voyage optimiza el embedding según el rol. Se enseña en `02-vector-search` como un gotcha crítico — omitirlo degrada retrieval silenciosamente.
12. **Bilingüe `es`/`en` desde día uno** — misma barra que Foundations, Caching, Tool use. 10 `exercise.md` totales al cierre.

## Risks & mitigations

- **Riesgo — `VOYAGE_API_KEY` ausente en CI**: el workflow PR actual skippea integration tests gracefully cuando falta `ANTHROPIC_API_KEY` (patrón existente); los tests nuevos siguen el mismo patrón con ambos keys guardeados en `beforeAll`. El weekly health-check CI sí requiere `VOYAGE_API_KEY` como secret nuevo para detectar drift de pricing/modelos.
  - **Mitigación**: (a) el `beforeAll` skippea con mensaje descriptivo si falta cualquiera de los dos keys, (b) el usuario agrega `VOYAGE_API_KEY` a los Actions secrets del repo (flagged en `next steps`), (c) PR CI sigue verde sin el secret nuevo.
- **Riesgo — Voyage cambia pricing o deprecan `voyage-3.5-lite`**: rompe el cost model del track.
  - **Mitigación**: `valid_until: 2026-10-15` (6 meses) + weekly health-check CI que pinguea el endpoint y verifica pricing.
- **Riesgo — Anthropic docs reshuffle rompe las fuentes de los chunks del fixture**: el contenido parafraseado queda desalineado con la docs canónica.
  - **Mitigación**: el fixture es canonical at commit time; `valid_until` da ventana de 6 meses; refresh es mecánico cuando expira.
- **Riesgo — no-determinismo del modelo en ejercicios de generación (04, 05)**: Haiku puede parafrasear diferente o elegir distinto set de chunks relevantes.
  - **Mitigación**: assertions estructurales sobre **shape de las citations** (`{ chunkId, quote }`) y sobre **ids de chunks recuperados** (conjunto esperado del top-K), NO sobre texto literal del LLM. Patrón consistente con tracks anteriores.

## Success criteria

- Los 5 ejercicios pasan `aidev verify <id> --solution` contra Voyage + Anthropic APIs reales
- `bun test` desde `code/` permanece verde (existing + nuevos)
- Costo total del track para el learner < $0.05 medido — en la práctica ~$0.01 (Voyage cubierto por free tier)
- PR CI workflow permanece verde sin nuevos secrets mandatory
- Weekly health-check CI requiere agregar `VOYAGE_API_KEY` como secret (flagged para el user)
- Cada ejercicio enseña **exactamente un concepto atómico** (verificable leyendo el `exercise.md`)
- Bilingüe completo: 10 `exercise.md` (5 `es` + 5 `en`)
- `aidev list` muestra `▸ 04-rag` como header auto-agrupado con los 5 ejercicios, sin tocar CLI

## Dependencies

Ninguna. Track foundational dentro de su propia scope — puede shippar en paralelo con cualquier otro trabajo. `@anthropic-ai/sdk ^0.40` ya instalado; no hay nuevos paquetes npm.

## Next steps

1. **Specs + design en paralelo** (via orchestrator):
   - `sdd-spec` → delta spec: nueva capability `rag-track` con requirements por ejercicio (shape assertions, grounding invariants, helper contracts)
   - `sdd-design` → ADRs (Voyage vs otros providers, raw `fetch` vs SDK, in-memory vs DB externa, `cost.ts`/harness sin cambios, citation format)
2. **Tasks breakdown** (`sdd-tasks`) — checklist por ejercicio (01→05) + fixture + README update
3. **Apply** (`sdd-apply`) por batches (strict TDD)
4. **Verify + archive**
5. **Post-archive (user action)**: agregar `VOYAGE_API_KEY` a GitHub Actions secrets del repo para el weekly health-check CI

---

## skill_resolution: injected
