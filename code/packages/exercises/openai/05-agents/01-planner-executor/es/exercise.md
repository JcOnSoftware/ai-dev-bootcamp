# Exercise 01 — Construí el loop básico del agente

## Concepto

Un **agente** no es más que un programa que repite tres pasos: **pensar** (el modelo decide qué hacer), **actuar** (vos ejecutás la herramienta que eligió), y **observar** (le devolvés el resultado para que siga razonando). Ese ciclo — pensar, actuar, observar — es la base de todo lo que llamamos "agente" en IA.

La diferencia fundamental con el tool calling de los ejercicios anteriores es que ahora no sabés de antemano cuántas veces va a llamar al modelo. Puede pedir una tool, recibir el resultado, pedir otra tool con esa info, y así hasta que tenga suficiente contexto para responder. Necesitás un `while` que termine cuando el modelo diga "ya terminé" (`finish_reason: "stop"`).

El patrón se llama **planner-executor**: el modelo es el planificador (decide qué hacer), y tu código es el ejecutor (lo hace). Esta separación de responsabilidades es lo que hace poderoso al agente — el modelo no ejecuta nada directamente, solo razona y elige herramientas.

```typescript
// Estructura del loop
while (true) {
  const response = await client.chat.completions.create({ messages, tools });
  messages.push(response.choices[0].message);
  if (response.choices[0].finish_reason === "stop") break;
  // ejecutá las tools y agregá los resultados a messages
}
```

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente OpenAI
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — ciclo completo de tool calling y cómo armar el loop
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia de `finish_reason`, `tool_calls` y mensajes `role: "tool"`

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI y un array `messages` con: `{ role: "user", content: "How many seconds are in 3.5 hours?" }`.
3. Definí dos tools:
   - `search_web(query: string)` — busca información en la web.
   - `calculate(expression: string)` — evalúa una expresión matemática.
4. Implementá el agent loop con un `while (true)`:
   - Llamá a la API con `model: "gpt-4.1-nano"`, `max_completion_tokens: 512`.
   - Pushá el mensaje del asistente a `messages`.
   - Si `finish_reason === "stop"`: guardá el contenido como `finalAnswer` y salí del loop.
   - Si `finish_reason === "tool_calls"`:
     - Incrementá un contador `steps`.
     - Para cada tool call: ejecutá `fakeSearchWeb` o `fakeCalculate` según el nombre.
     - Pushá `{ role: "tool", tool_call_id, content: JSON.stringify(result) }` por cada resultado.
5. Retorná `{ steps, finalAnswer }`.

## Cómo verificar

```bash
aidev verify 01-planner-executor
```

Los tests verifican:
- Se hacen al menos 2 llamadas a la API (el loop ejecutó al menos una ronda de tools)
- La primera llamada tiene `finish_reason: "tool_calls"`
- La última llamada tiene `finish_reason: "stop"`
- `steps` es un número >= 1
- `finalAnswer` es un string no vacío

## Concepto extra (opcional)

Los agentes reales implementan **límites de seguridad**: máximo de iteraciones (para evitar loops infinitos), timeouts por llamada, y detección de ciclos (el modelo pide la misma tool con los mismos args dos veces). Sin estos controles, un bug en el prompt puede hacer que el agente gire indefinidamente consumiendo tokens y dinero. En producción, siempre agregá un `if (steps > MAX_STEPS) break` como red de seguridad.
