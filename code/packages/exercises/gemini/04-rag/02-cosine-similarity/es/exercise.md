# Exercise 02 — Cosine similarity between two embeddings

## Concepto

Un vector de embedding solo no sirve — no podés saber si está "bien" sin compararlo con algo. La forma estándar de comparar dos embeddings es **cosine similarity**:

```
cos(a, b) = (a · b) / (||a|| * ||b||)
```

Mide el ángulo entre vectores, bounded en `[-1, +1]`:
- `+1` = misma dirección (semánticamente idéntico)
- `0` = ortogonal (no relacionados)
- `-1` = dirección opuesta (raro en la práctica)

Como los embeddings de Gemini están **pre-normalizados** (L2 norm ≈ 1, del ejercicio 01), la fórmula se simplifica a el dot product:

```ts
cosineSimilarity(a, b) = sum(a[i] * b[i] for i in 0..n)
```

Un multiply por dimensión. Barato.

Vas a verificar la intuición core de los embeddings: una oración de perros y una de gatos scorean ALTO (ambos mascotas), mientras que una de perros y una de PHP scorean MÁS BAJO (dominios totalmente distintos).

## Docs & referencias

1. [Guía de embeddings](https://ai.google.dev/gemini-api/docs/embeddings) — recap del ejercicio 01
2. [Referencia de `embedContent`](https://ai.google.dev/api/embeddings) — `contents` array retorna un array ordenado de embeddings
3. [Cosine similarity en Wikipedia](https://en.wikipedia.org/wiki/Cosine_similarity) — la matemática

## Tu tarea

1. Implementá `cosineSimilarity(a, b)` usando el shortcut de pre-normalizado (solo el dot product).
2. Embedeá las 3 oraciones de `starter.ts` con UNA llamada — pasá `contents` como array. El array `embeddings` del response preserva el orden.
3. Computá:
   - `relatedScore = cosineSimilarity(A, B)` — perros vs gatos (ambos mascotas)
   - `unrelatedScore = cosineSimilarity(A, C)` — perros vs PHP
4. Retorná `{ relatedScore, unrelatedScore }`.

## Cómo verificar

```bash
aidev verify 02-cosine-similarity
```

Los tests verifican:
- Al menos 1 llamada a `embedContent`
- Ambos scores son números finitos
- Ambos scores están en `[-1, +1]`
- **`relatedScore > unrelatedScore`** — esta es la intuición core de RAG
- Delta al menos `0.05` (significativamente separado, no solo ruido)

## Concepto extra (opcional)

Los VALORES absolutos de cosine similarity son model-specific — `gemini-embedding-001` tiende a clusterear scores en `[0.3, 0.9]`, mientras que algunos embeddings viejos clusterean en `[0.6, 0.95]`. Lo que importa es el **orden**: entre tus candidates, ¿cuál scorea más alto vs el query?

Por eso los sistemas RAG usan cosine similarity para RANKEAR — no para decidir un threshold sí/no. En la práctica retrievás los top-K documentos más similares y los pasás al LLM, confiando en que el modelo maneja el juicio final de relevancia.

Para scorear corpus grandes (millones de docs), no computás todas las similarities pairwise — usás un índice de approximate nearest-neighbor (ANN) como FAISS o una vector DB gestionada (Pinecone, Weaviate, Vertex AI Vector Search). Misma matemática de similarity abajo, con una estructura de datos más inteligente.
