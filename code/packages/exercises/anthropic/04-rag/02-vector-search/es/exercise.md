# 02 — Vector Search

## Concepto

Una vez que tenés embeddings, podés construir un **índice vectorial** y hacer búsqueda semántica. El flujo es:

1. **Indexar**: embebé todos los textos del corpus con `input_type: "document"` → guardás los vectores junto con los chunks.
2. **Buscar**: embebé la query con `input_type: "query"` → calculás similitud coseno contra cada vector del índice → devolvés los top-K más similares.

Este ejercicio implementa un **O(n) scan** en memoria — pedagógicamente simple. En producción usarías pgvector, Pinecone, o Chroma para búsqueda aproximada de vecinos (ANN) a escala.

**Asimetría `input_type`**: el vector de query "apunta hacia" los vectores de documentos. Usar `"document"` para la query degrada la calidad de retrieval.

## Docs y referencias

- Voyage AI Embeddings API: <https://docs.voyageai.com/reference/embeddings>
- Voyage AI Models: <https://docs.voyageai.com/docs/embeddings>
- Costo estimado: ~$0.000 (voyage-3.5-lite, free tier)

## Tu tarea

Implementá tres cosas en `starter.ts`:

1. **`buildIndex(chunks)`** — llamá a Voyage AI con todos los textos del corpus usando `"document"` como `input_type`. Devolvé los chunks con su embedding adjunto (`IndexedChunk[]`).

2. **`search(index, query, topK)`** — embebé la query con `"query"`, calculá similitud coseno contra cada chunk del índice, devolvé los top-K ordenados por score descendente.

3. **`run()`** — construí el índice desde `DOCS_CHUNKS`, buscá `"What is prompt caching TTL?"`, devolvé top-3.

## Cómo verificar

```bash
aidev verify 02-vector-search
aidev verify 02-vector-search --solution
```

## Qué validan los tests

**Tests de integración (API real):**
- `buildIndex(DOCS_CHUNKS)` devuelve 15 entradas, cada una con `embedding` de longitud 1024
- Cada `IndexedChunk` preserva los campos originales (`id`, `text`, `metadata`)
- `search(index, query, 3)` devuelve 3 resultados ordenados por score descendente
- Los topics de los top resultados para "how does prompt caching work?" hacen match con `/cache|cache-control|ttl|caching/i`
- `run()` devuelve 3 resultados

## Concepto extra

**¿Por qué O(n) y no ANN?** Con 15 chunks, un scan lineal tarda microsegundos. En producción con millones de vectores, usás Approximate Nearest Neighbor (HNSW, IVF) — 1000x más rápido al costo de un pequeño error de recall. Para aprender RAG, el scan es suficiente y te muestra la mecánica exacta.

**Batcheá el corpus**: enviá todos los chunks en una sola llamada a Voyage AI. Más eficiente que N llamadas separadas y más amigable con los rate limits.
