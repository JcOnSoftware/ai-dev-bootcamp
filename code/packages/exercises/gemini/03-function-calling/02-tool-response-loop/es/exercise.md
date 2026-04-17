# Exercise 02 — Close the tool loop with a function response

## Concepto

El ejercicio 01 cortó después de que el modelo dijo "quiero llamar a `get_current_weather`". Eso por sí solo no sirve — el learner no recibió respuesta. El **tool loop** es cómo lo cerrás:

1. **Turn 1**: pregunta del user → modelo retorna un `functionCall`.
2. **Vos** ejecutás la función (localmente, en tu código).
3. **Turn 2**: mandás la conversación completa (mensaje del user + call del modelo + tu resultado) → modelo retorna respuesta en lenguaje natural grounded en el output de la tool.

El shape del `contents` del turn 2 importa. Es un array de TRES items:

```ts
[
  { role: "user",  parts: [{ text: "<pregunta original>" }] },
  { role: "model", parts: [{ functionCall: { name, args } }] },      // lo que dijo el modelo en turn 1
  { role: "user",  parts: [{ functionResponse: { name, response } }] }, // resultado de tu tool
]
```

Nota el role del function response: `"user"`, no `"tool"` (a diferencia de algunos otros SDKs). Gemini trata el resultado de la tool como parte del lado del user en la conversación.

## Docs & referencias

1. [Guía de function calling](https://ai.google.dev/gemini-api/docs/function-calling) — overview completo incluyendo multi-turn
2. [Multi-turn tool loop](https://ai.google.dev/gemini-api/docs/function-calling#multi-turn) — el shape exacto de contents que necesitás
3. [Recurso `Content`](https://ai.google.dev/api/caching#Content) — referencia de roles y parts

## Tu tarea

1. Reusá el patrón `WEATHER_DECL` del ejercicio 01 (podés inlinearlo acá).
2. Hacé turn 1 con `contents: "What's the weather in Tokyo?"` y `config.tools`. Leé `response.functionCalls[0]`.
3. Ejecutá `getCurrentWeather(call.args)` (el stub ya está en `starter.ts`).
4. Hacé turn 2 con el array `contents` de 3 items mostrado arriba, pasando los mismos `config.tools` de nuevo.
5. Contá turns (`turnCount` debe ser 2).
6. Retorná `{ answer, calledFunction, calledArgs, turnCount }`.

## Cómo verificar

```bash
aidev verify 02-tool-response-loop
```

Los tests verifican:
- Exactamente 2 llamadas a generateContent
- El `contents` del turn 2 es un array con una part que tiene `functionResponse`
- El `contents` del turn 2 también incluye el `functionCall` del turn previo del modelo
- `answer` retornado es no vacío
- `turnCount === 2`
- `calledFunction` incluye `weather` y `calledArgs.location` es string
- La respuesta se apoya en el output del stub (menciona `partly cloudy`, `cloudy` o `18`)

## Concepto extra (opcional)

En sistemas de agentes reales el resultado de la tool no siempre es un objeto plano — podría ser un JSON string, un mensaje de error, o incluso otro output estructurado. La convención es: poné un objeto JSON-serializable en `response`, y el modelo lo maneja. No trates de embedar lenguaje natural pre-renderizado en `response.response` — eso derrota el punto de la separación entre "data" y "cómo el modelo describe data."

Cuando una tool falla, pasá de vuelta un shape de error tipo `{ response: { error: "rate_limited", details: "..." } }`. El modelo va a reconocer el fallo en su respuesta en vez de alucinar éxito. Eso es más seguro que tirar throw en tu código, porque el modelo puede decidir si reintentar con args distintos o disculparse al user.
