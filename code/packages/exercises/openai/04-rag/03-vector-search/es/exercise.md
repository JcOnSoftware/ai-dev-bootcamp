# Exercise 03 — Vector Search

## Concepto

La búsqueda vectorial (o **vector search**) es el corazón del RAG. La idea es simple: convertís tanto tus documentos como la query del usuario en vectores, y después buscás qué documentos son más "cercanos" al vector de la query.

La métrica de distancia más usada es la **similitud coseno** (cosine similarity). Mide el ángulo entre dos vectores: si el ángulo es 0° (vectores idénticos), la similitud es 1. Si el ángulo es 90° (vectores ortogonales, sin relación), la similitud es 0. La fórmula es:

```
cosine_similarity(a, b) = dot_product(a, b) / (magnitude(a) * magnitude(b))
```

Lo bueno de OpenAI es que podés embedear múltiples textos en una sola llamada pasando un array como `input`. Eso significa que podés embedir los 5 documentos y la query en una sola request — más eficiente y más barato.

## Docs & referencias

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — similitud coseno, distancia euclidiana y cuándo usar cada una
2. [Embeddings API reference](https://platform.openai.com/docs/api-reference/embeddings/create) — parámetros completos, incluido batch input
3. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente

## Tu tarea

1. Abrí `starter.ts`. Los `DOCUMENTS` y el `QUERY` ya están definidos — no los modifiques.
2. Embebé todos los documentos Y la query en una sola llamada a `client.embeddings.create()`.
   - `input`: `[QUERY, ...DOCUMENTS]`
3. Implementá `cosineSimilarity(a, b)` que calcule la similitud coseno entre dos vectores.
4. Calculá la similitud entre el embedding de la query y cada embedding de documento.
5. Ordená los resultados de mayor a menor similitud.
6. Retorná `{ query: QUERY, results }` donde cada result es `{ text, similarity }`.

## Cómo verificar

```bash
aidev verify 03-vector-search
```

Los tests verifican:
- `query` es un string no vacío
- `results` es un array con al menos 1 ítem
- Cada resultado tiene `text` (string) y `similarity` (número)
- Los valores de `similarity` están entre 0 y 1
- Los resultados están ordenados de mayor a menor por `similarity`
- El resultado más relevante es el documento sobre TypeScript

## Concepto extra (opcional)

En este ejercicio, buscamos en 5 documentos con fuerza bruta — O(n). En producción con millones de vectores, esto es demasiado lento. Ahí entran las bases de datos vectoriales como **Pinecone**, **Weaviate**, **Qdrant** o **pgvector** (extensión de PostgreSQL). Estas implementan algoritmos de búsqueda aproximada (ANN — Approximate Nearest Neighbor) como HNSW que son órdenes de magnitud más rápidos.
