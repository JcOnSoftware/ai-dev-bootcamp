# Exercise 05 — Let the agent recover from a tool failure

## Concepto

Las tools fallan. Redes se caen, rate limits pegan, inputs vienen mal. Cuando una tool falla en medio del agent loop, tenés tres opciones:

1. **Throw** — dejá que la excepción propague. El turn entero del agente falla, y el user ve un stack trace. Usualmente mal.
2. **Fallback silencioso** — sustituí con un resultado genérico "no data". El modelo no sabe que pasó algo raro y puede inventar una respuesta con confianza. Usualmente muy mal.
3. **Surface el error en el `functionResponse`** y dejá que el modelo lo vea. El modelo lee `{ error: "...", message: "..." }` y decide qué hacer: retry, probar otra tool, o decirle al user. Usualmente bien.

La opción 3 es idiomática. Funciona porque Gemini lee el shape del function response inteligentemente — si retornás `{ error, message }`, el modelo lo trata como señal de falla y muchas veces decide solo retry, ajustar args, o explicar el fallo.

Podés nudgear esto con un **hint en la description**: `"... si el lookup retorna un error object, retry once con la misma key."` Ese es el truco que usa este ejercicio.

## Docs & referencias

1. [Guía de function calling](https://ai.google.dev/gemini-api/docs/function-calling) — incluyendo convenciones de error-handling
2. [Shape de `FunctionResponse`](https://ai.google.dev/api/caching#FunctionResponse) — `response` es un objeto free-form, usá el shape que quieras
3. [Prompting strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) — cómo las descriptions guían el comportamiento del modelo

## Tu tarea

1. `unreliableLookup` en `starter.ts` es determinista: call #1 retorna un shape de error, call #2+ retorna data real.
2. Declará una tool `lookup(key)` con una description que mencione explícitamente el contract de retry-on-error.
3. Armá el agent loop estándar. User prompt: `"Look up 'user_profile' and tell me whether you got the data."`
4. Ruteá calls a `unreliableLookup`, después appendeá el objeto retornado como `response` en la part `functionResponse`.
5. Llamá `resetCallCount()` al inicio. Después del loop, leé `getCallCount()`.
6. Retorná `{ lookupCallCount, toolCalls, answer }`.

## Cómo verificar

```bash
aidev verify 05-error-recovery
```

Los tests verifican:
- Al menos 3 llamadas a `generateContent` (primera → retry → respuesta final)
- **`lookupCallCount >= 2`** — el modelo realmente reintentó después del error
- Todas las tool calls fueron `lookup`
- El `contents` del turn 2 incluye un `functionResponse` con `response.error === "timeout"` (el error fue surface'eado al modelo)
- La respuesta final reconoce éxito (menciona data, retry, o la key)

## Concepto extra (opcional)

Los agentes productivos necesitan **retries acotados**. El modelo podría loopear para siempre llamando a la misma tool fallando. Patrones:

- **MAX_TURNS** limita el largo absoluto del loop (lo tenés desde el ejercicio 01).
- **Contador a nivel tool**: trackeá `lookupCallCount` vos y rechazá forwardear retries después de N intentos. Retorná `{ error: "retries_exhausted", ... }` para forzar al modelo a moverse.
- **Backoff**: insertá `await sleep(2000)` entre retries del MISMO tool call con MISMOS args para evitar hacer hammering al upstream.

Una tool que siempre retorna `{ error, message }` pero el modelo la sigue llamando es un síntoma clásico de loop atascado. Defense in depth: el agente debería darse por vencido después de retries, el harness de tools debería rate-limitear por (tool_name, args_hash), y MAX_TURNS es el backstop final.
