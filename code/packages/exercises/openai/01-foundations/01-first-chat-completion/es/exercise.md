# Exercise 01 — Your first chat completion

## Concepto

La API de OpenAI se organiza alrededor de **chat completions** — enviás una lista de mensajes y recibís una respuesta del modelo. Cada mensaje tiene un `role` (`system`, `user`, `assistant`) y `content`.

El SDK de Node.js (`openai`) lee `OPENAI_API_KEY` del entorno automáticamente. Creás un cliente, llamás a `client.chat.completions.create()` con el modelo, los mensajes y un límite de tokens, y recibís un objeto `ChatCompletion` con `choices`, `usage` y `model`.

El modelo más barato disponible es `gpt-4.1-nano` — ideal para aprender sin gastar. Cada llamada en este ejercicio cuesta fracciones de centavo.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia completa del endpoint
3. [Models](https://platform.openai.com/docs/models) — lista de modelos disponibles y sus capacidades

## Tu tarea

1. Abrí `starter.ts` y creá una instancia del cliente OpenAI.
2. Llamá a `client.chat.completions.create()` con:
   - `model`: `"gpt-4.1-nano"` (el más económico)
   - `max_completion_tokens`: un número entre 1 y 200
   - `messages`: un array con un solo mensaje de rol `"user"`
3. Retorná la respuesta completa (el objeto `ChatCompletion`).

## Cómo verificar

```bash
aidev verify 01-first-chat-completion
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- Se usa un modelo GPT
- `max_completion_tokens` está entre 1 y 500
- Se envía un mensaje de usuario con contenido no vacío
- La respuesta tiene al menos un choice con contenido
- Se reporta uso de tokens (prompt + completion)

## Concepto extra (opcional)

La respuesta de OpenAI tiene una estructura diferente a otros providers. En vez de un array `content` con bloques tipados, OpenAI usa `choices[0].message.content` como string. El campo `finish_reason` te dice por qué el modelo paró: `"stop"` (terminó naturalmente), `"length"` (llegó al límite de tokens), o `"tool_calls"` (quiere usar una herramienta).
