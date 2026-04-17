# Exercise 05 — End-to-end RAG: retrieve then generate

## Concepto

Armaste cada pieza por separado: embed (01), comparar (02), buscar (03), chunkear (04). Ahora conectalas en un pipeline completo de **Retrieval-Augmented Generation**:

```
query del user
    ↓
embedeá query
    ↓
scoreá chunks del corpus
    ↓
agarrá top-K
    ↓
stuffeá chunks en un prompt con la pregunta
    ↓
generá respuesta (grounded en el contexto retrievado)
```

Dos decisiones de diseño importan mucho en el step 5:

1. **Instrucción**: decile al modelo que use SOLO las sources, y que diga "not in the sources" cuando la respuesta no esté ahí. Sin esto, el modelo responde desde su training data — derrotando el punto entero.
2. **Labels**: prefijá cada chunk con `[Source 1]`, `[Source 2]`, etc. El modelo reutiliza esas labels confiablemente en su respuesta, dándote citations gratis.

Template del prompt que vas a usar:

```
Answer the question using ONLY the sources below. If the answer isn't in the sources, say "not in the sources".

[Source 1] <texto del chunk>
[Source 2] <texto del chunk>

Question: <query del user>
```

## Docs & referencias

1. [Overview del patrón RAG](https://ai.google.dev/gemini-api/docs/embeddings#retrieval-augmented-generation) — la secuencia canónica embed+retrieve+generate
2. [Prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) — cómo estructurar prompts grounded
3. [Guía de embeddings](https://ai.google.dev/gemini-api/docs/embeddings) — recap de los ejercicios 01-04

## Tu tarea

1. Chunkeá + embedeá el `ARTICLE` (paragraph-level, taskType `RETRIEVAL_DOCUMENT`).
2. Embedeá el query `"What disease is linked to broken mitochondria?"` con `RETRIEVAL_QUERY`.
3. Scoreá cada chunk contra el query, agarrá **top 2**.
4. Construí el prompt stuffeado descrito arriba.
5. Llamá `ai.models.generateContent({ model: "gemini-2.5-flash-lite", contents: prompt, config: { maxOutputTokens: 200 } })`.
6. Retorná:
   ```ts
   {
     usedChunkIds: [ids de los 2 chunks retrievados],
     answer: response.text,
   }
   ```

## Cómo verificar

```bash
aidev verify 05-rag-pipeline
```

Los tests verifican:
- Al menos 2 llamadas a `embedContent` (corpus + query) Y exactamente 1 llamada a `generateContent`
- Retorno tiene `usedChunkIds: number[]` + `answer: string`
- Los chunk IDs retrievados son enteros en `[0, 3]` (indexes de paragraph válidos)
- **El retrieval incluyó el párrafo de enfermedades (index 3)** — el correcto
- El prompt de `generateContent` contiene el texto del chunk de enfermedades (menciona Parkinson / Alzheimer)
- La respuesta final o menciona los nombres de enfermedades (grounded correctamente) o dice "not in the sources" (honró el guard)

## Concepto extra (opcional)

Este es el pipeline RAG mínimo. Todo lo que producción agrega cae en 3 categorías:

1. **Calidad de retrieval**: hybrid search (vectors + keyword), rerankers, query rewriting, HyDE (generar doc hipotético + embed).
2. **Context management**: chunk dedupe, filtros de metadata (por fecha, por tenant), diversidad de source (no elegir 3 chunks casi idénticos).
3. **Calidad de respuesta**: citations estructuradas (labels tipo `[Source 1]` en la respuesta), tuning de refusal, loops de fact-check.

La zona de peligro en RAG es citations hallucinadas — el modelo dice "[Source 2] dice X" pero Source 2 no dice nada de eso. Patrones defensivos: post-procesá la respuesta y asegurá que cada referencia `[Source N]` realmente aparece en el chunk correspondiente. Si no, flaggealo o regenerá.

Una cosa más: el pipeline entero de arriba es stateless. En un chat agent real también necesitás llevar el contexto de turns PREVIOS adelante para que los follow-ups ("¿y los síntomas?") sepan a qué tema se refiere "los". Los agents (track 05) manejan esto.
