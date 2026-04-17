# Exercise 01 — Build the core agent loop

## Concepto

El ejercicio 02 del track 03 (function-calling) hizo un loop manual de DOS turns: user → model-calls-tool → vos-ejecutás-tool → model-responde. Alcanza cuando sabés de antemano que el modelo solo necesita una tool call. Los agentes reales no funcionan así — encadenan MUCHAS tool calls, deciden cuándo parar, y a veces escalan a otras tools en medio de la conversación.

El **agent loop** es la estructura de control que hace esto:

```
contents = [user_message]
loop:
  response = generateContent(contents, tools)
  if response NO tiene function calls:
    return response.text  # respuesta final
  ejecutar cada function call
  agregar calls del modelo + tus resultados a contents
  repetir
```

Dos cosas importan:

1. **Terminación**: un modelo atrapado en un rut de tool-calling puede pegar max-turns para siempre. Siempre limitá iteraciones. Un techo sensato es 5-10 para tareas generales, 20-30 para agentes de research de larga duración.
2. **Append-no-reemplazar**: cada turn agrega a `contents`. NUNCA lo reemplazás. El modelo ve toda la historia en cada turn.

Vas a construir el loop contra una tool stub simple `multiply(a, b)`. El user dice "¿cuánto es 37 × 42?" y el modelo debería llamar `multiply`, leer el resultado, luego retornar la respuesta natural incluyendo 1554.

## Docs & referencias

1. [Guía de function calling](https://ai.google.dev/gemini-api/docs/function-calling) — el lifecycle completo
2. [Multi-turn tool loop](https://ai.google.dev/gemini-api/docs/function-calling#multi-turn) — el shape de `contents` a través de turns
3. [Recurso `Content`](https://ai.google.dev/api/caching#Content) — estructura role + parts

## Tu tarea

1. Construí un array inicial `contents` con el mensaje del user (`"What is 37 times 42? Use the multiply tool."`).
2. Loopeá hasta `MAX_TURNS` (usá 6):
   - Llamá `generateContent` con `model: "gemini-2.5-flash"`, `contents`, y `config.tools: [{ functionDeclarations: [MULTIPLY_DECL] }]`.
   - Si `response.functionCalls` está vacío → retorná `{ turnCount, toolCalls, answer: response.text }`.
   - Si no, agregá DOS mensajes a `contents`:
     - `{ role: "model", parts: [{ functionCall }] }` — la call anunciada del modelo
     - `{ role: "user", parts: [{ functionResponse: { name, response: multiply(args) } }] }` — tu resultado
   - Registrá cada nombre de call en `toolCalls`.
3. Si el loop pega `MAX_TURNS`, lanzá — el agente se colgó.

## Cómo verificar

```bash
aidev verify 01-agent-loop
```

Los tests verifican:
- Al menos 2 llamadas a `generateContent` (el loop corrió al menos dos turns)
- El ÚLTIMO response capturado NO tiene partes `functionCall` (señal de terminación)
- Retorno tiene `{ turnCount, toolCalls, answer }`
- Al menos una tool call pasó y todas las invocaciones son `multiply`
- `turnCount` matchea el número de llamadas a `generateContent` que vio el harness
- El `answer` final contiene `1554` (el producto correcto)

## Concepto extra (opcional)

En un agente real, `MAX_TURNS` no solo previene loops infinitos — también es un **control de presupuesto**. Cada turn cuesta plata y latencia. Para un chatbot podrías capar en 3 y caer a "no pude figurarlo, ¿podés reformular?" cuando se excede el presupuesto.

Algunos modelos están entrenados para "pensar en voz alta" antes de tool calls — vas a ver texto + una function call en el mismo response. Seguí agregando ambos al history; Gemini los maneja bien. No filtres las text parts en model turns.

Los próximos ejercicios extienden esto: chains de tareas multi-step (02), estructura planner-executor (03), memoria a través de user turns (04), y recuperación de errores cuando las tools tiran (05).
