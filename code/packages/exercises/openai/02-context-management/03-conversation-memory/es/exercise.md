# Exercise 03 — Multi-turn conversation memory

## Concepto

El API de OpenAI es **stateless** — no recuerda nada entre llamadas. Para que el modelo "recuerde" lo que se dijo antes, vos tenés que enviar todo el historial en cada request. Así funciona el patrón de conversación multi-turno:

```
Turno 1: messages = [{ user: "My name is Ada." }]
         → respuesta del modelo → la agregás al array

Turno 2: messages = [
           { user: "My name is Ada." },
           { assistant: "Nice to meet you, Ada!" },
           { user: "What's my name?" }
         ]
         → modelo responde "Ada" porque tiene el contexto
```

Cada vez que mandás una request, el array `messages` crece con los turnos anteriores. Esto es lo que le da al modelo "memoria" — en realidad no recuerda nada, vos le pasás el historial completo.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — formato del array `messages` multi-turno

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un array `messages: ChatCompletionMessageParam[]` vacío.
3. **Turno 1**: pusheá `{ role: "user", content: "My name is Ada." }`, llamá a la API, pusheá la respuesta del asistente.
4. **Turno 2**: pusheá `{ role: "user", content: "What's my name?" }`, llamá a la API, pusheá la respuesta.
5. **Turno 3**: pusheá `{ role: "user", content: "Say my name backwards." }`, llamá a la API — esta es `finalResponse`.
6. Retorná `{ turns: 3, finalResponse }`.

Usá `model: "gpt-4.1-nano"` y `max_completion_tokens: 64` en cada llamada.

## Cómo verificar

```bash
aidev verify 03-conversation-memory
```

Los tests verifican:
- Se hacen exactamente 3 llamadas a la API
- La primera llamada tiene exactamente 1 mensaje
- La última llamada tiene al menos 5 mensajes (historial acumulado)
- `turns` es `3`
- `finalResponse` tiene contenido (string no vacío)
- Cada llamada subsiguiente tiene más mensajes que la anterior

Los tests NO verifican el texto exacto de las respuestas.

## Concepto extra (opcional)

Este patrón de "pasar todo el historial en cada request" es exactamente lo que usan ChatGPT, Claude.ai y todos los chatbots modernos. La diferencia está en cómo manejan la memoria a largo plazo:

- **Window-based**: solo las últimas N conversaciones (lo que hiciste acá)
- **Summarization**: cuando el historial es muy largo, lo resumen antes de pasarlo (próximo ejercicio)
- **Vector memory**: embeddings de las conversaciones pasadas para buscar lo relevante (RAG)
- **External storage**: guardan el historial en una DB y lo cargan según necesidad

Para la mayoría de casos de uso, window-based + summarization es más que suficiente.
