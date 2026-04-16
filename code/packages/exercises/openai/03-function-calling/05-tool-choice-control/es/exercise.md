# Exercise 05 — Control de tool_choice: auto, required, none

## Concepto

Por defecto el modelo decide si llamar una tool o no (`tool_choice: "auto"`). Pero hay casos en los que necesitás tomar vos el control. OpenAI expone tres modos con el parámetro `tool_choice`:

- **`"auto"`** (default): el modelo decide si usa una tool, cuál, y con qué argumentos. La opción más flexible.
- **`"required"`**: el modelo **debe** llamar al menos una tool. Útil cuando necesitás extraer datos estructurados y no querés que el modelo responda con texto libre.
- **`"none"`**: el modelo **no puede** llamar ninguna tool, aunque las tengas definidas. Útil para generar texto puro en contextos donde también tenés tools disponibles.

También podés forzar una tool específica con `tool_choice: { type: "function", function: { name: "get_weather" } }`, lo que garantiza que el modelo use esa función exacta.

```typescript
// Forzar una función específica
tool_choice: { type: "function", function: { name: "get_weather" } }
```

## Docs & referencias

1. [SDK Node.js](https://github.com/openai/openai-node) — instalación y uso del cliente
2. [Function Calling guide](https://platform.openai.com/docs/guides/function-calling) — sección sobre tool_choice
3. [Chat Completions API](https://platform.openai.com/docs/api-reference/chat/create) — referencia del parámetro `tool_choice`

## Tu tarea

1. Abrí `starter.ts`.
2. Creá un cliente OpenAI.
3. Definí la tool `get_weather(location: string)`.
4. Usá siempre el mismo mensaje: `"What's the weather in Paris?"`
5. Hacé **3 llamadas** con `model: "gpt-4.1-nano"`, `max_completion_tokens: 256`:
   - Llamada 1: `tool_choice: "auto"`
   - Llamada 2: `tool_choice: "required"`
   - Llamada 3: `tool_choice: "none"`
6. Retorná `{ autoResult, requiredResult, noneResult }`.

## Cómo verificar

```bash
aidev verify 05-tool-choice-control
```

Los tests verifican:
- Se hacen exactamente 3 llamadas a la API
- La primera tiene `tool_choice: "auto"` (o undefined)
- La segunda tiene `tool_choice: "required"`
- La tercera tiene `tool_choice: "none"`
- La llamada con `"required"` tiene `finish_reason: "tool_calls"`
- La llamada con `"none"` tiene `finish_reason: "stop"` y sin tool_calls
- El return tiene las 3 propiedades: `autoResult`, `requiredResult`, `noneResult`

## Concepto extra (opcional)

`tool_choice: "required"` es muy útil para **extracción de datos estructurados** como alternativa a Structured Outputs. Definís una tool cuyo "resultado" es el schema que querés, mandás `tool_choice: "required"`, y leerías los argumentos que el modelo construyó — son el dato estructurado. No necesitás ejecutar nada real: la tool es un "truco" para forzar al modelo a generar JSON con la estructura que vos decidiste.
