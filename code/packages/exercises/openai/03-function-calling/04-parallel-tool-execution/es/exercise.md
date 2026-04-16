# Exercise 04 — Parallel tool execution

## Concepto

OpenAI puede devolver **múltiples tool calls en una sola respuesta**. En lugar de pedir el clima de Tokyo, esperar el resultado, pedir el de London, esperar, y luego pedir el de New York, el modelo dice todo de una vez: "necesito get_weather para Tokyo, London y New York simultáneamente". Eso es **parallel tool calling** y está habilitado por defecto.

La diferencia con el ejercicio anterior es que el array `tool_calls` puede tener 2, 3 o más entradas en la misma respuesta, todas referenciando la misma función con distintos argumentos. Tu responsabilidad es ejecutarlas **todas** y devolver **todos** los resultados antes de hacer la segunda llamada.

```typescript
// firstResponse.choices[0].message.tool_calls puede ser:
[
  { id: "call_1", function: { name: "get_weather", arguments: '{"location":"Tokyo"}' } },
  { id: "call_2", function: { name: "get_weather", arguments: '{"location":"London"}' } },
  { id: "call_3", function: { name: "get_weather", arguments: '{"location":"New York"}' } },
]
// Tenés que responder con 3 mensajes role: "tool" antes de la segunda llamada
```

Usar `Promise.all` para ejecutar las tools en paralelo es la práctica correcta: si cada tool tardara 1 segundo, ejecutarlas en serie tomaría 3 segundos, pero en paralelo toman 1.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — sección de parallel tool calling
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — parámetro `parallel_tool_calls`

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI.
3. Definí la tool `get_weather(location: string)`.
4. Empezá messages con: `"What's the weather in Tokyo, London, and New York?"`
5. Hacé la **primera llamada** con `model: "gpt-4.1-nano"`, `max_completion_tokens: 512`, y `parallel_tool_calls: true`.
6. Guardá todos los `tool_calls` de la respuesta.
7. Ejecutá **TODOS** en paralelo con `Promise.all`, llamando a `fakeGetWeather` para cada uno.
8. Agregá un mensaje `role: "tool"` por cada resultado.
9. Hacé la **segunda llamada** con los mensajes actualizados.
10. Retorná `{ toolCallCount: toolCalls.length, response: finalResponse }`.

## Cómo verificar

```bash
aidev verify 04-parallel-tool-execution
```

Los tests verifican:
- Se hacen al menos 2 llamadas a la API
- La primera respuesta tiene al menos 2 tool_calls (parallel)
- La segunda llamada tiene al menos 2 mensajes `role: "tool"`
- `userReturn.toolCallCount` es >= 2
- La respuesta final tiene texto y `finish_reason: "stop"`

## Concepto extra (opcional)

`parallel_tool_calls: false` le dice al modelo que solo pida una tool por vez, en secuencia. Puede ser útil cuando las tools tienen dependencias entre sí (ej: primero autenticarse, después leer datos). Por defecto está en `true` porque en la mayoría de los casos quisieras paralelismo.
