# Exercise 04 — Summarization loops for context compression

## Concepto

La truncación simple descarta mensajes — a veces exactamente los que contienen información importante. Una alternativa más elegante es la **compresión por resumen**: cuando el historial se vuelve muy largo, le pedís al modelo que lo resuma en una sola oración, y usás ese resumen como contexto para las conversaciones siguientes.

El patrón se llama **rolling context** (contexto rodante):

```
[Turno 1] → [Turno 2] → [Turno 3] → DEMASIADO LARGO
                                           ↓
                              Pedí un resumen → "summary"
                                           ↓
                        Nueva conversación con sistema: "Context: {summary}"
```

La ventaja sobre truncar es que no perdés información importante — la comprimís. La desventaja es que le cuesta un request extra y puede perder detalles específicos.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — formato de mensajes multi-turno

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y un array `messages`.
3. **Turno 1**: user `"I am building a TypeScript REST API using Express and PostgreSQL."` → guardá respuesta.
4. **Turno 2**: user `"I want to add authentication using JWT tokens."` → guardá respuesta.
5. **Llamada de resumen**: agregá `{ role: "user", content: "Summarize our conversation so far in exactly one sentence." }` al array de mensajes y mandá el request. Guardá el texto de respuesta como `summary`.
6. **Nueva conversación con el resumen**: creá un nuevo request con:
   - `system`: `"Context from previous conversation: ${summary}"`
   - `user`: `"What should I implement next?"`
   Guardá esto como `finalResponse`.
7. Retorná `{ summary, finalResponse }`.

Usá `model: "gpt-4.1-nano"`, `max_completion_tokens: 128` (y 64 para la llamada de resumen).

## Cómo verificar

```bash
aidev verify 04-summarization-loops
```

Los tests verifican:
- Al menos 3 llamadas a la API (2 normales + 1 resumen + opcionalmente 1 final)
- `summary` es un string no vacío
- `summary` es razonablemente corto (< 500 caracteres) — es "una oración"
- `finalResponse` tiene contenido
- Todas las llamadas usan `gpt-4.1-nano`

## Concepto extra (opcional)

En sistemas de producción, el rolling context suele funcionar así:

```
if (countTokens(messages) > TOKEN_THRESHOLD) {
  const summary = await summarize(messages);
  messages = [{ role: "system", content: `Previous context: ${summary}` }];
}
```

Hay variantes más sofisticadas que preservan los últimos N mensajes *además* del resumen (para no perder contexto inmediato), y que hacen el resumen de forma incremental (en lugar de resumir toda la historia, solo resumen la parte antigua):

```
messages = [
  { role: "system", content: `Earlier context: ${summary}` },
  ...recentMessages  // últimos 4-6 mensajes sin tocar
];
```

Esta combinación — resumen del pasado + ventana del presente — es el patrón más robusto para aplicaciones de chat largas.
