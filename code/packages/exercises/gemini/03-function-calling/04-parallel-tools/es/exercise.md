# Exercise 04 — Parallel tool calls in a single response

## Concepto

Cuando un user dice "**dame el clima en Tokyo, Buenos Aires y Berlín**", no querés tres turns secuenciales del modelo — uno por ciudad. La latencia sería terrible. Gemini soporta **parallel tool calling**: en un único response, el modelo retorna MÚLTIPLES partes `functionCall`. Vos disparás las tres en paralelo (ej. `Promise.all`), juntás resultados y los alimentás juntas en el turn siguiente.

Este es el mismo mecanismo que ya viste — la única diferencia es que `response.functionCalls` ahora tiene >1 entrada. Tu código tiene que manejar `functionCalls` como array, no agarrar `[0]` e ignorar el resto.

Para este ejercicio, solo probás que las calls paralelas pasan. El "execute + feedback" real espeja el ejercicio 02 pero envuelto en `Promise.all` — cubierto conceptualmente acá y completo en track 05 (agents).

## Docs & referencias

1. [Parallel function calling](https://ai.google.dev/gemini-api/docs/function-calling#parallel) — cómo Gemini decide emitir varias calls
2. [`GenerateContentResponse.functionCalls`](https://ai.google.dev/api/generate-content#GenerateContentResponse) — el array de conveniencia del SDK
3. [Guía de function calling](https://ai.google.dev/gemini-api/docs/function-calling) — el workflow completo

## Tu tarea

1. Declará `get_weather(location)` igual al ejercicio 01.
2. Llamá `generateContent`:
   - `model`: `"gemini-2.5-flash-lite"`
   - `contents`: `"What's the weather in Tokyo, Buenos Aires, and Berlin?"`
   - `config.tools`: `[{ functionDeclarations: [weatherDecl] }]`
   - `config.maxOutputTokens`: `256`
3. Leé `response.functionCalls` (un ARRAY).
4. Mapealo a `calledFunctions: string[]` y `locations: string[]`.
5. Retorná `{ calledFunctions, locations }`.

## Cómo verificar

```bash
aidev verify 04-parallel-tools
```

Los tests verifican:
- Exactamente 1 llamada a la API (un solo response, varias function calls adentro)
- Retorno tiene dos arrays: `calledFunctions` y `locations`
- `calledFunctions.length >= 2` — las calls paralelas pasaron
- Cada entry en `calledFunctions` es `"get_weather"`
- Al menos 2 de las 3 ciudades (Tokyo, Buenos Aires, Berlin) se extraen en `locations`

## Concepto extra (opcional)

En producción el siguiente paso es `Promise.all(locations.map(getWeather))`, luego mandar UN turn 2 que contenga tantas `functionResponse` parts como `functionCall` parts hubo. Gemini las mergea y responde con una única respuesta grounded.

Parallel calling es oportunista — el modelo decide cuándo las tareas son lo suficientemente independientes. Para "cuál es el clima en Tokyo Y qué appointments tengo hoy?" muchas veces vas a recibir calls paralelas a dos funciones DISTINTAS (`get_weather` + `list_calendar_events`). Ese es el poder real: el modelo razona sobre independencia, vos solo despachás.
