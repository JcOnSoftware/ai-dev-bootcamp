# Exercise 02 — Truncation strategies for long conversations

## Concepto

En aplicaciones de chat reales, el historial de conversación crece con cada turno. Si lo mandás completo, eventualmente vas a superar el límite del contexto — o simplemente vas a pagar demasiado en tokens. La solución más simple es **truncar**: descartar los mensajes más viejos y conservar solo los más recientes.

La regla de oro es: **siempre preservar el mensaje de sistema** (que define el comportamiento del asistente) y **los últimos N mensajes** del historial.

```typescript
// Estrategia: sistema + últimos 6 mensajes (3 intercambios)
const truncatedMessages = [systemMessage, ...history.slice(-6)];
```

Esta estrategia es O(1) en complejidad y no requiere contar tokens — simplemente limitás la cantidad de mensajes. La desventaja es que podés perder contexto importante que estaba al principio de la conversación.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — formato del array `messages`

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un mensaje de sistema: `"You are a helpful assistant that discusses programming topics."`
3. Construí un historial con 5 pares de user/assistant (10 mensajes en total). Podés usar cualquier tema — preguntas sobre programación funcionan bien.
4. Calculá `originalCount = 1 + 10 = 11` (sistema + historial).
5. Aplicá truncación: `const truncatedMessages = [systemMessage, ...history.slice(-6)]`.
6. Calculá `truncatedCount = truncatedMessages.length` (debería ser 7).
7. Enviá los mensajes truncados con `model: "gpt-4.1-nano"` y `max_completion_tokens: 128`.
8. Retorná `{ originalCount, truncatedCount, response }`.

## Cómo verificar

```bash
aidev verify 02-truncation-strategies
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- El request tiene a lo sumo 7 mensajes
- El primer mensaje del request es el de sistema
- La respuesta tiene contenido (string no vacío)
- `originalCount > truncatedCount`
- `truncatedCount` coincide con la cantidad de mensajes enviados

## Concepto extra (opcional)

Truncar por cantidad de mensajes es simple pero impreciso. En producción, lo ideal es truncar por **conteo de tokens** usando una librería como `tiktoken`:

```typescript
import { encoding_for_model } from "tiktoken";

function countTokens(messages: ChatCompletionMessageParam[]): number {
  const enc = encoding_for_model("gpt-4o");
  return messages.reduce((sum, msg) => {
    return sum + enc.encode(typeof msg.content === "string" ? msg.content : "").length + 4;
  }, 0);
}
```

Así podés truncar hasta quedarte bajo un límite de tokens específico (por ejemplo 3000), en lugar de un número fijo de mensajes.
