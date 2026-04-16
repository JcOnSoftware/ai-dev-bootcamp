# Exercise 02 — Implementá el loop de tool calling

## Concepto

En el ejercicio anterior el modelo te pidió llamar a una función pero no la ejecutaste. Ahora cerrás el ciclo. El **tool calling loop** es el patrón fundamental de agentes: el modelo decide qué herramienta necesita, vos la ejecutás y le devolvés el resultado, y el modelo usa ese resultado para dar una respuesta final.

El flujo completo tiene exactamente dos llamadas a la API:

1. **Primera llamada**: mandás el mensaje del usuario + las tools disponibles. El modelo responde con `finish_reason: "tool_calls"` y un array `tool_calls` en el mensaje del asistente.
2. **Ejecutás las tools**: leés `tool_calls`, corré cada función con los argumentos que el modelo proveyó, y agregás los resultados al historial como mensajes con `role: "tool"`.
3. **Segunda llamada**: mandás el historial completo (mensajes originales + mensaje del asistente + resultados de las tools). El modelo ahora tiene toda la info y responde con texto final.

```typescript
// Después de ejecutar la tool, el historial se ve así:
messages = [
  { role: "user",      content: "What's the weather in Buenos Aires?" },
  { role: "assistant", content: null, tool_calls: [{ id: "call_abc", ... }] },
  { role: "tool",      tool_call_id: "call_abc", content: '{"temperature":22,"condition":"sunny"}' },
]
```

Nota: el `tool_call_id` del resultado debe coincidir exactamente con el `id` del tool_call que lo generó.

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — guía oficial con el ciclo completo
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia del parámetro `tools` y mensajes `role: "tool"`

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y un array `messages` con el mensaje del usuario.
3. Definí la tool `get_weather` con parámetro `location` (string, requerido).
4. Hacé la **primera llamada** con `model: "gpt-4.1-nano"`, `max_completion_tokens: 512`.
5. Agregá el mensaje del asistente al array `messages`.
6. Para cada `toolCall` en `assistantMessage.tool_calls`:
   - Parseá `toolCall.function.arguments` para obtener `location`.
   - Llamá a `fakeGetWeather(location)`.
   - Agregá un mensaje `{ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) }`.
7. Hacé la **segunda llamada** con los mensajes actualizados.
8. Retorná la respuesta final.

## Cómo verificar

```bash
aidev verify 02-tool-calls-loop
```

Los tests verifican:
- Se hacen exactamente 2 llamadas a la API
- La primera llamada tiene `finish_reason: "tool_calls"`
- La segunda llamada incluye un mensaje con `role: "tool"`
- El mensaje tool tiene un `tool_call_id` no vacío
- El contenido del mensaje tool es JSON válido con `temperature` y `condition`
- La respuesta final tiene `finish_reason: "stop"`
- La respuesta final tiene contenido de texto

## Concepto extra (opcional)

En producción, el loop no termina después de una sola ronda de tools. Un agente real sigue llamando al modelo y ejecutando tools hasta que recibe `finish_reason: "stop"`. Ese patrón — un `while` que termina cuando el modelo deja de pedir tools — es la base de todo framework de agentes (LangChain, LlamaIndex, etc.). Lo implementás en el track de Agentes.
