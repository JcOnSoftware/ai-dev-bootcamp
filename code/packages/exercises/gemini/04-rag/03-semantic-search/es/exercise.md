# Exercise 03 — Top-K semantic search over a corpus

## Concepto

Tenés cosine similarity (ejercicio 02). Tenés embeddings (ejercicio 01). Ahora encadenalos: dado un **corpus** (muchos docs) y un **query**, retornás los K docs más similares al query. Esa es la mitad de retrieval de RAG.

El pipeline, como mínimo:

1. Embedeá cada doc en el corpus. Guardá tuplas `(id, text, vector)`.
2. Embedeá el query.
3. Computá cosine similarity entre el query y cada doc.
4. Ordená descendente por score. Sliceá top-K.

Los sistemas de producción cachean el step 1 (los embeddings no cambian salvo que cambie el corpus) y usan un índice de approximate-nearest-neighbor (ANN) para el step 3 cuando el corpus es grande. Para corpus chicos (<10k docs) un linear scan es suficientemente rápido.

La API de embeddings de Gemini también te deja hintear el **task type**. Los docs y los queries son asimétricos:
- `taskType: "RETRIEVAL_DOCUMENT"` → lado-store, optimizado para ser retrievado
- `taskType: "RETRIEVAL_QUERY"` → lado-query, optimizado para retrievar de un store

Usalos cuando hacés búsqueda retrieval-specific. Es un lift de calidad chico — esencialmente gratis optar por él.

## Docs & referencias

1. [Guía de embeddings — task types](https://ai.google.dev/gemini-api/docs/embeddings#task-types) — por qué document vs query importa
2. [Referencia de `embedContent`](https://ai.google.dev/api/embeddings) — batch embedding (pasá `contents` como array)
3. [Overview del patrón RAG](https://ai.google.dev/gemini-api/docs/embeddings#retrieval-augmented-generation) — recap embed-retrieve-generate

## Tu tarea

1. Embedeá el array `CORPUS` de `starter.ts` con UNA llamada batched. Usá `config.taskType: "RETRIEVAL_DOCUMENT"`.
2. Embedeá el query string (`"How do cells produce energy?"`) con `config.taskType: "RETRIEVAL_QUERY"`.
3. Para cada doc, computá cosine similarity entre el vector del query y el del doc.
4. Ordená descendente por score, sliceá top 3.
5. Retorná un array de entries `{ index, text, score }`.

## Cómo verificar

```bash
aidev verify 03-semantic-search
```

Los tests verifican:
- Al menos 2 llamadas a `embedContent` (corpus + query)
- Al menos una usa un `taskType` `RETRIEVAL_*`
- El retorno tiene al menos 1 hit con shape `{ index: number, text: string, score: number }`
- Los resultados están ordenados descendente por score
- **El top hit para `"How do cells produce energy?"` es la oración sobre mitocondrias** (index 0) — la respuesta bio más obvia

## Concepto extra (opcional)

En producción casi siempre querés embedear el corpus UNA VEZ al index time y persistir los vectores junto con los IDs. Re-embedear en cada query es wasteful y lento.

Una implementación común: filas `(id, text, embedding)` en una vector DB (Pinecone, Weaviate, Qdrant, pgvector). Las APIs de search aceptan el vector del query y retornan los IDs top-K. Tu código después busca los textos por ID.

Para los model-card-curious: `gemini-embedding-001` fue específicamente benchmarkeado en tasks de retrieval, y los scores oficiales de MTEB lo ponen en el top tier. El naming "gemini-embedding" es nuevo — NO es lo mismo que `text-embedding-004` (el modelo Google más viejo y chico). Pineá el nuevo en tu código.
