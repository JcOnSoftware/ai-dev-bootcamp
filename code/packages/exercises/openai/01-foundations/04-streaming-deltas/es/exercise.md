# Exercise 04 — Streaming responses token by token

## Concepto

Por defecto, la API de OpenAI espera a generar la respuesta completa antes de devolvértela. El **streaming** cambia eso: el modelo te manda tokens a medida que los genera, lo que permite mostrar texto progresivo en la UI (como ChatGPT).

Con `stream: true`, el método `create` devuelve un **async iterable** de objetos `ChatCompletionChunk`. Cada chunk tiene:
```typescript
chunk.choices[0].delta.content  // string | null | undefined — el fragmento de texto
chunk.choices[0].finish_reason  // "stop" | "length" | null — por qué terminó (último chunk)
```

El último chunk suele tener `choices[0].delta.content` como `undefined` o vacío, y `finish_reason` con un valor. Si usás `stream_options: { include_usage: true }`, el chunk final también tiene `usage` con el conteo de tokens.

Para consumir el stream usás `for await`:
```typescript
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) process.stdout.write(delta);
}
```

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y configuración del cliente
2. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia completa del endpoint
3. [Streaming guide](https://platform.openai.com/docs/guides/streaming) — guía oficial de streaming

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y llamá a `client.chat.completions.create` con:
   - `model: "gpt-4.1-nano"`
   - `max_completion_tokens: 128`
   - `messages: [{ role: "user", content: "Count from 1 to 5, one number per line." }]`
   - `stream: true`
   - `stream_options: { include_usage: true }`
3. Iterá sobre el stream con `for await` y recolectá los deltas de contenido no vacíos en un array `chunks: string[]`.
4. Retorná `{ chunks, fullText: chunks.join("") }`.

## Cómo verificar

```bash
aidev verify 04-streaming-deltas
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- La llamada usa `stream: true`
- La llamada está marcada como `streamed: true`
- Se retorna `chunks` como array con al menos un elemento
- Se retorna `fullText` como string no vacío
- `fullText` es igual a `chunks.join("")`

## Concepto extra (opcional)

En una app real, el streaming sirve para mostrar texto progresivo al usuario. El patrón típico en Node.js es:

```typescript
process.stdout.write(delta); // escribe sin newline — efecto "typewriter"
```

En una app web (React, Next.js), usarías el Streaming API de `ReadableStream` o el Vercel AI SDK, que tiene helpers para convertir un stream de OpenAI en un `ReadableStream` compatible con `Response`.

También podés acumular el stream en el servidor y emitir eventos Server-Sent Events (SSE) al cliente — es lo que hace ChatGPT internamente.
