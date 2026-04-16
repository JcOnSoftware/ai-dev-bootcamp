# Exercise 03 — Puntuación multi-criterio de salidas

## Concepto

Un puntaje único (1-5) es útil, pero no te dice QUÉ está fallando. ¿Es que la respuesta no es relevante? ¿O es relevante pero tiene un tono inapropiado? ¿O es relevante y tiene buen tono pero los hechos son incorrectos? Para responder esto, necesitás **puntuación multi-criterio**.

La idea es evaluar la salida del modelo en múltiples dimensiones simultáneamente: relevancia (¿responde lo que se preguntó?), precisión (¿los hechos son correctos?), tono (¿es el estilo apropiado?), y un puntaje general. Cada dimensión da información accionable: si la relevancia baja, el prompt está mal enfocado; si la precisión baja, el modelo está alucinando.

Este patrón se usa mucho en sistemas de RAG (Retrieval Augmented Generation) donde es crítico saber si el modelo usó correctamente el contexto recuperado. También se usa en chatbots de soporte al cliente para verificar que las respuestas sean técnicamente correctas Y amigables.

Los structured outputs son fundamentales acá: necesitás que el juez devuelva un JSON con exactamente los campos que esperás, no texto libre que tenés que parsear con regex.

## Docs & referencias

1. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia del endpoint para ambas llamadas.
2. [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) — cómo usar `response_format: { type: "json_schema" }` con `strict: true`.
3. [OpenAI Node SDK](https://github.com/openai/openai-node) — README del SDK, instalación y ejemplos.

## Tu tarea

Implementá la función `run()` en `starter.ts`:

1. Creá un cliente OpenAI con `new OpenAI()`.
2. **Llamada 1 — la respuesta**: pedile al modelo que conteste una pregunta técnica.
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `300`
   - System: `"You are a helpful assistant. Answer concisely and accurately."`
   - User: `"What are the main benefits of TypeScript over JavaScript?"`
   - Guardá el texto: `response.choices[0].message.content`
3. **Llamada 2 — el scorer**: evaluá la respuesta en múltiples dimensiones.
   - `model`: `"gpt-4.1-nano"`, `max_completion_tokens`: `300`
   - System: `"You are an expert evaluator. Score the following answer on these criteria (1-5 each): relevance, accuracy, tone. Also provide an overall score and brief feedback."`
   - User: `"Question: What are the main benefits of TypeScript over JavaScript?\n\nAnswer: " + <respuesta de la llamada 1>`
   - `response_format: { type: "json_schema" }` con schema que tenga `relevance`, `accuracy`, `tone`, `overall` (todos `number`) y `feedback` (`string`), todos requeridos, `strict: true`.
4. Parseá el JSON de la llamada 2.
5. Retorná `{ answer: <texto llamada 1>, scores: <objeto parseado> }`.

## Cómo verificar

```bash
aidev verify 03-output-scoring
```

Los tests verifican que:

- Se hicieron exactamente **2 llamadas** a la API.
- La segunda llamada usa `response_format` con `type: "json_schema"`.
- El retorno tiene `answer` (string no vacío).
- `scores.relevance`, `scores.accuracy`, `scores.tone`, `scores.overall` son números entre 1 y 5.
- `scores.feedback` es un string no vacío.

## Concepto extra (opcional)

En sistemas reales, las dimensiones de scoring se diseñan junto con el equipo de producto. Por ejemplo, un chatbot de soporte podría evaluar: `technical_accuracy`, `customer_empathy`, `resolution_clarity`, `response_time_appropriate`. Cada dimensión se pondera diferente según el objetivo del negocio. Esto se llama **weighted scoring**.
