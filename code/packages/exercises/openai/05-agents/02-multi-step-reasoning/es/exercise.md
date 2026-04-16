# Exercise 02 — Razonamiento multi-paso con herramientas encadenadas

## Concepto

En el ejercicio anterior el agente necesitaba pocas tools para responder. En la realidad, los problemas interesantes requieren **encadenar múltiples herramientas** — el resultado de una tool alimenta la siguiente, y así hasta construir la respuesta completa.

Este patrón se llama **chain-of-tools** o razonamiento multi-paso: el modelo descompone el problema en sub-tareas, ejecuta cada una secuencialmente usando el resultado anterior como contexto, y al final sintetiza todo en una respuesta. Es exactamente como vos resolvés un problema complejo: primero recopilás datos, después los procesás, después comparás, y recién entonces respondés.

La clave arquitectural es que **el historial de mensajes es la memoria del agente**. Cada resultado de tool que agregás al array `messages` queda disponible para el modelo en la siguiente iteración. No necesitás gestionar estado externo — el contexto acumulado en `messages` es todo lo que el agente necesita para razonar.

```typescript
// El historial crece con cada iteración
messages = [
  { role: "user",      content: "Which city has higher density?" },
  { role: "assistant", tool_calls: [{ name: "get_population", args: {city:"Tokyo"} }] },
  { role: "tool",      content: '{"population":13960000}' },
  { role: "assistant", tool_calls: [{ name: "get_area", args: {city:"Tokyo"} }] },
  // ... y sigue
]
```

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente OpenAI
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — cómo encadenar múltiples tools en un agent loop
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — estructura de mensajes y tool calls en el historial

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y un array `messages` con: `{ role: "user", content: "Which city has higher population density: Tokyo or London?" }`.
3. Definí tres tools:
   - `get_population(city: string)` — retorna la población de una ciudad.
   - `get_area(city: string)` — retorna el área en km².
   - `calculate(expression: string)` — evalúa una expresión matemática.
4. Implementá el agent loop (igual al ejercicio anterior).
5. Ejecutá cada tool call con la función fake correspondiente.
6. Retorná `{ totalCalls, finalAnswer }` donde `totalCalls` es la cantidad de llamadas a la API realizadas.

## Cómo verificar

```bash
aidev verify 02-multi-step-reasoning
```

Los tests verifican:
- Se hacen al menos 3 llamadas a la API (el modelo necesita múltiples rondas)
- `totalCalls` >= 3
- `finalAnswer` es un string no vacío
- Al menos 2 nombres de tools distintas fueron usados
- La última llamada tiene `finish_reason: "stop"`

## Concepto extra (opcional)

El razonamiento multi-paso tiene un costo: cada iteración del loop hace una llamada a la API y aumenta el contexto en el historial. Para problemas con muchos pasos, el costo en tokens puede crecer significativamente. Estrategias para mitigarlo: **parallel tool calling** (el modelo pide múltiples tools en un solo turn), **tool result summarization** (resumís el historial periódicamente), o **graph-based agents** (cada nodo del grafo es una tool, evitás redundancias). LangGraph y CrewAI implementan estas ideas.
