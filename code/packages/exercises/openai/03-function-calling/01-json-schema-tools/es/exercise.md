# Exercise 01 — Definí una tool con JSON Schema

## Concepto

**Function calling** (también llamado _tool use_) es la capacidad del modelo de indicarte que necesita ejecutar una función externa antes de poder responder. En lugar de inventar datos que no tiene, el modelo te dice "llamá a esta función con estos argumentos" y espera el resultado.

OpenAI implementa esto con el parámetro `tools` en la llamada a `chat.completions.create`. Cada tool es un objeto con `type: "function"` y una descripción en JSON Schema de qué hace la función y qué parámetros acepta. El modelo usa esa descripción para decidir cuándo y cómo llamarla.

Cuando el modelo necesita una tool, responde con `finish_reason: "tool_calls"` y el campo `choices[0].message.tool_calls` contiene un array de llamadas, cada una con el nombre de la función y los argumentos ya parseados como string JSON. En este ejercicio solo llegás hasta ese punto: definís la tool y mandás el mensaje. La ejecución real la hacés en el ejercicio siguiente.

```typescript
// La respuesta NO tiene texto — tiene tool_calls
const toolCall = response.choices[0].message.tool_calls?.[0];
// toolCall.function.name === "get_weather"
// toolCall.function.arguments === '{"location":"Tokyo, Japan","unit":"celsius"}'
```

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — guía oficial con el ciclo completo
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia del parámetro `tools`

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI.
3. Llamá a `client.chat.completions.create` con:
   - `model: "gpt-4.1-nano"`, `max_completion_tokens: 256`
   - `messages: [{ role: "user", content: "What's the weather in Tokyo?" }]`
   - `tools`: un array con una sola tool de tipo `"function"` llamada `get_weather`
     - `description`: `"Get the current weather for a location"`
     - `parameters`: JSON Schema con `type: "object"` y propiedades:
       - `location` (string, requerido): ciudad y país
       - `unit` (string, enum `["celsius", "fahrenheit"]`): unidad de temperatura
4. Retorná la respuesta directamente. **No ejecutes la tool todavía.**

## Cómo verificar

```bash
aidev verify 01-json-schema-tools
```

Los tests verifican:
- Se hace exactamente 1 llamada a la API
- El request incluye un array `tools` con al menos 1 elemento
- La primera tool tiene `type: "function"`
- El nombre de la función es `"get_weather"`
- La función tiene un objeto `parameters`
- El `finish_reason` de la respuesta es `"tool_calls"`
- La respuesta tiene `tool_calls` con al menos 1 entrada
- El tool call referencia la función `get_weather`

## Concepto extra (opcional)

El JSON Schema en `parameters` puede ser tan rico como necesités. Podés usar `description` en cada propiedad (muy recomendado — el modelo las lee para entender el contexto), `enum` para valores acotados, `type: "array"`, `type: "object"` anidados, y `$defs` para reutilizar schemas. Cuanto más clara sea la descripción, mejor elige el modelo cuándo y cómo llamar la función.
