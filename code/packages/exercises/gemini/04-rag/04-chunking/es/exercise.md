# Exercise 04 — Chunking a long document for retrieval

## Concepto

Un artículo de 700 palabras embedido como UN vector es una mezcla de todo lo que cubre — mitocondrias, fotosíntesis, enfermedad, ciclo de Krebs. La dirección del vector es un "promedio" de todos esos temas. Cuando querás sobre UNO de ellos (digamos, Parkinson), el score del vector-promedio es mediocre porque los otros temas diluyen la señal.

El fix: **chunkeá** el documento en piezas más chicas, embedeá cada chunk por separado, y retrievá a granularidad de chunk. Cada chunk queda topicalmente coherente, así que su vector apunta nítidamente a un sujeto. El retrieval surfacea el chunk relevante — no el artículo entero.

**Estrategias de chunking** van de ingenuas a smart:

| Estrategia | Cómo | Cuándo |
|---|---|---|
| Tamaño fijo | Cada 500 chars | La más simple, pero corta a mitad de oración |
| Split por oración | `.split(/\\. /)` | Más limpio, pero pierde contexto entre oraciones |
| **Split por párrafo** | `.split(/\\n\\n/)` | Matchea estructura humana — usualmente el default correcto |
| Sliding window + overlap | Ventanas de 500 con 50 de overlap | Preserva contexto en bordes |
| Chunking semántico | Agrupar oraciones por similarity | Calidad máxima, más compute |

Para este ejercicio usamos split por párrafo (uno párrafo = un chunk) porque el artículo usa blank lines. Buenos defaults.

## Docs & referencias

1. [Tips de embeddings para quality search](https://ai.google.dev/gemini-api/docs/embeddings#tips-for-quality-search) — chunk size, overlap, task types
2. [`embedContent` batched](https://ai.google.dev/api/embeddings) — `contents: string[]` retorna un embedding por chunk
3. [Overview de RAG](https://ai.google.dev/gemini-api/docs/embeddings#retrieval-augmented-generation) — por qué retrieval a nivel chunk le gana a nivel doc

## Tu tarea

1. Llamá a `chunkByParagraph(ARTICLE)` — debería dar **4 párrafos**.
2. Embedeá todos los chunks con `config.taskType: "RETRIEVAL_DOCUMENT"` (una call, `contents: chunks`).
3. Embedeá el query `"What disease is linked to broken mitochondria?"` con `config.taskType: "RETRIEVAL_QUERY"`.
4. Para cada chunk, computá `cosineSimilarity(queryVec, chunkVec)`.
5. Retorná un array de `{ id, text, score }` ordenado DESCENDENTE por score (retorná TODOS los chunks para que puedas ver el ranking).

## Cómo verificar

```bash
aidev verify 04-chunking
```

Los tests verifican:
- Al menos 2 llamadas a `embedContent`
- La call del corpus usó un `contents` array (batched)
- Retorno tiene exactamente 4 chunks
- Cada chunk tiene `{ id: number, text: string, score: number }`
- Ordenado descendente por score
- **El top chunk menciona Parkinson o Alzheimer** (el párrafo de enfermedades) — el target correcto de retrieval

## Concepto extra (opcional)

El **overlap** ayuda cuando la respuesta cruza un borde de párrafo — ej., "en resumen" aparece al final del párrafo 2 y el resumen real arranca en el párrafo 3. Una sliding window con, digamos, 10% de overlap mantiene contexto en ambos lados del corte.

Para sistemas de producción con decenas de miles de docs, embedding + reranking se vuelve su propio stage de pipeline: (1) retrieval inicial barato vía índice ANN, (2) rerank más lento pero accurate sobre el top-50 usando un modelo cross-encoder. Gemini también expone un endpoint **reranker** vía la API `ranking` — vale la pena explorar en sistemas reales.

No te olvides: el retrieval a nivel chunk no preserva la identidad del documento. Guardá `(doc_id, chunk_id, text, vector)` para saber qué doc original produjo cada chunk — lo vas a querer para citations en el ejercicio 05.
