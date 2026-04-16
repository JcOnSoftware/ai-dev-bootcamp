# Exercise 04 — Retrieval Pipeline

## Concepto

RAG (**Retrieval-Augmented Generation**) es el patrón que combina búsqueda semántica con generación de texto. En vez de pedirle al modelo que "recuerde" datos, le pasás el contexto relevante directamente en el prompt. El modelo solo necesita leer y razonar sobre lo que le das — no hace falta fine-tuning ni que el modelo conozca el dato de antemano.

El pipeline completo tiene 4 etapas:
1. **Chunk**: dividís el corpus en fragmentos manejables
2. **Embed**: convertís todos los chunks en vectores
3. **Retrieve**: para una query dada, buscás los chunks más similares
4. **Generate**: enviás los chunks relevantes como contexto al modelo de chat

Este patrón resuelve uno de los problemas más comunes con los LLMs: la **alucinación**. Al forzar al modelo a responder solo con el contexto provisto, reducís drásticamente las respuestas inventadas.

## Docs & referencias

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — embeddings como base del retrieval step
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — endpoint que usás para la generación final
3. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente

## Tu tarea

1. Abrí `starter.ts`. El `CORPUS` y el `QUERY` ya están definidos — no los modifiques.
2. Dividí el `CORPUS` en chunks de ~200 caracteres con 50 de overlap.
3. Embebé todos los chunks y la query en una sola llamada a `client.embeddings.create()`.
4. Calculá la similitud coseno entre la query y cada chunk. Elegí los **top 2**.
5. Llamá a `client.chat.completions.create()` con:
   - `model`: `"gpt-4.1-nano"`
   - `max_completion_tokens`: 256
   - `messages`: system con `"Answer using only the provided context."` + user con la query y los chunks como contexto
6. Retorná `{ query: QUERY, context: topChunks, answer }`.

## Cómo verificar

```bash
aidev verify 04-retrieval-pipeline
```

Los tests verifican:
- Se hace al menos 1 llamada de chat completion
- La request incluye un mensaje `system` y un mensaje `user`
- `query` es un string no vacío
- `context` es un array con al menos 1 chunk
- `answer` es un string no vacío
- La respuesta menciona "TypeScript" (recuperación correcta)

## Concepto extra (opcional)

El sistema prompt `"Answer using only the provided context."` es la clave para el **grounding**: le instruís al modelo a no usar conocimiento externo. Podés reforzarlo agregando `"If the answer is not in the context, say 'I don't know'."` para evitar que el modelo "complete" información que no está en el contexto. El siguiente ejercicio explora cómo pedirle al modelo que cite sus fuentes explícitamente.
