# Exercise 05 — Citations and Grounding

## Concepto

El **grounding** es la práctica de anclar las respuestas del modelo a fuentes verificables. Un sistema RAG sin citas te da respuestas que pueden estar bien, pero no sabés de qué parte del corpus vienen. Con citas, podés verificar cada afirmación y mostrarle al usuario la fuente original.

La técnica es simple: en el system prompt le instruís al modelo que use un formato específico de cita, como `[Source N]`. Después procesás la respuesta con una regex para extraer todas las referencias. El resultado es una respuesta que mezcla texto generado con referencias que podés mapear a los chunks originales.

Este patrón es fundamental en aplicaciones empresariales de RAG donde la trazabilidad importa: si el modelo dice algo, tiene que poder justificarlo con una fuente del corpus.

## Docs & referencias

1. [Embeddings guide](https://platform.openai.com/docs/guides/embeddings) — embeddings para el retrieval step
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — endpoint de generación con system prompt
3. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente

## Tu tarea

1. Abrí `starter.ts`. El `CORPUS` y el `QUERY` ya están definidos — no los modifiques.
2. Implementá el pipeline RAG completo (chunk → embed → retrieve top 2 → generate).
3. En el system prompt, instruí al modelo:
   `"Answer using only the provided context. Always cite your sources using [Source N] format where N is the source number."`
4. Formateá el contexto como:
   `[Source 1] <chunk1>\n\n[Source 2] <chunk2>`
5. Extraé las citas del texto de la respuesta usando la regex `/\[Source \d+\]/g`.
6. Retorná `{ answer, citations }` donde `citations` es el array de strings que matchearon.

## Cómo verificar

```bash
aidev verify 05-citations-grounding
```

Los tests verifican:
- Se hace al menos 1 llamada de chat completion
- El system message contiene instrucciones de citado
- `answer` es un string no vacío
- `citations` es un array
- El answer contiene al menos un marcador de cita como `[Source N]`
- `citations` tiene al menos 1 entrada
- Cada cita matchea el formato `[Source N]`

## Concepto extra (opcional)

Podés llevar las citas más lejos: en vez de solo extraer el marcador `[Source N]`, podés mapear cada cita al chunk original y mostrarle al usuario el texto exacto del que vino la información. También podés pedirle al modelo que use structured output (JSON) para devolver las citas como un array tipado en vez de extraerlas con regex — eso es más robusto pero más complejo. Para sistemas de producción, combinar ambas técnicas da el mejor resultado.
