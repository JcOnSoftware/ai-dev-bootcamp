# Exercise 02 — Chunking Strategies

## Concepto

Antes de poder embedear documentos grandes, necesitás dividirlos en fragmentos más pequeños — a esto se le llama **chunking**. El motivo es simple: los modelos de embedding tienen un límite de tokens de entrada, y además, chunks más pequeños dan resultados de búsqueda más precisos porque contienen menos ruido.

La estrategia más básica es **fixed-size chunking**: dividís el texto cada N caracteres. Pero si cortás justo en el medio de una oración, perdés contexto. La solución es agregar un **overlap** (superposición): el siguiente chunk empieza un poco antes del final del chunk anterior. Así, cada chunk comparte algunos caracteres con el anterior y el siguiente.

Por ejemplo con `chunkSize=200` y `overlap=50`:
- Chunk 1: caracteres 0–199
- Chunk 2: caracteres 150–349 (retrocede 50 desde el borde)
- Chunk 3: caracteres 300–499

Este ejercicio es **puro algoritmo** — no hay llamada a la API. Es fundamental entender esta etapa antes de pasar al embedding y la búsqueda.

## Docs & referencias

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — contexto sobre por qué chunkeamos antes de embedear
2. [SDK Node.js](https://github.com/openai/openai-node) — referencia del SDK (útil para los ejercicios siguientes)
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia del endpoint de generación (siguiente track)

## Tu tarea

1. Abrí `starter.ts`. El texto de muestra `SAMPLE_TEXT` ya está definido — no lo modifiques.
2. Implementá la función `chunkText(text, chunkSize, overlap)` que:
   - Divide `text` en fragmentos de a lo sumo `chunkSize` caracteres
   - Cada chunk consecutivo empieza `chunkSize - overlap` caracteres después del anterior
   - No genera chunks vacíos
3. Llamá a `chunkText(SAMPLE_TEXT, 200, 50)`.
4. Retorná `{ chunks, chunkCount }` donde `chunkCount === chunks.length`.

## Cómo verificar

```bash
aidev verify 02-chunking-strategies
```

Los tests verifican:
- No se hace ninguna llamada a la API
- `chunks` es un array con más de 1 ítem
- Cada chunk tiene como máximo 250 caracteres
- No hay chunks vacíos
- `chunkCount` es igual a `chunks.length`

## Concepto extra (opcional)

El chunking basado en caracteres es simple pero impreciso. En producción, es mejor chunkear por **tokens** (porque los límites de la API son en tokens, no en caracteres). También existen estrategias más sofisticadas como **recursive character splitting** (divide por `\n\n`, luego `\n`, luego ` `) o **semantic chunking** (usa embeddings para detectar cambios de tema). Para este bootcamp, el chunking por caracteres es suficiente para entender el concepto.
