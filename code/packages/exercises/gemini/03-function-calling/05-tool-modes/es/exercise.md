# Exercise 05 — Force, forbid, or allow tool calls (mode)

## Concepto

Por default, function calling es **oportunista**: Gemini decide por request si tus tools son relevantes. Está bien para un chatbot. Pero algunos workflows necesitan garantías más fuertes:

- Un **agente de form-filling** que DEBE terminar cada turn con un function call estructurado — nunca texto libre.
- Un **sistema safety-sensitive** que NUNCA debe llamar tools sobre input del user (ej., durante un audit de prompt-injection).
- Un **controller chiquito** que solo puede elegir de un subset de funciones declaradas.

El `toolConfig.functionCallingConfig.mode` de Gemini te da ese control. Valores (del enum `FunctionCallingConfigMode`):

| Mode | Comportamiento |
|---|---|
| `AUTO` (default) | Modelo decide — puede llamar una función o retornar texto |
| `ANY` | Modelo DEBE llamar una de las funciones declaradas |
| `NONE` | Modelo NO DEBE llamar ninguna función; respuesta texto pura |

Bajo `ANY` podés restringir aún más cuáles funciones están permitidas con `allowedFunctionNames: ["specific_fn"]`. Va bien con role-based access — un agente "intern" solo puede llamar tools read-only, un agente "manager" puede el set completo.

## Docs & referencias

1. [Modes de function calling](https://ai.google.dev/gemini-api/docs/function-calling#modes) — semántica de AUTO / ANY / NONE
2. [`ToolConfig`](https://ai.google.dev/api/caching#ToolConfig) — el nesting de config
3. [`FunctionCallingConfig`](https://ai.google.dev/api/caching#FunctionCallingConfig) — `mode`, `allowedFunctionNames`

## Tu tarea

Hacé DOS llamadas con el MISMO mensaje del user `"Tell me a joke."` y la MISMA declaración `get_weather`. La única diferencia es el mode.

1. **Call 1 — `AUTO`**: `toolConfig.functionCallingConfig.mode: FunctionCallingConfigMode.AUTO`. En un prompt de chiste con una tool de weather, el modelo debería retornar TEXTO PURO (sin function call).
2. **Call 2 — `ANY`**: `toolConfig.functionCallingConfig.mode: FunctionCallingConfigMode.ANY` con `allowedFunctionNames: ["get_weather"]`. El modelo DEBE llamar la función, aunque el prompt no tenga nada que ver con el clima — va a inventar una location.
3. Retorná:
   ```ts
   { autoCalled: boolean,           // ¿hubo function call en call 1?
     forcedFunctionName: string     // el name que invocó la forced call
   }
   ```

## Cómo verificar

```bash
aidev verify 05-tool-modes
```

Los tests verifican:
- Exactamente 2 llamadas a la API
- Ambas declaran la tool weather
- Una setea `mode: "AUTO"`, la otra `mode: "ANY"`
- Retorno tiene `autoCalled: boolean` + `forcedFunctionName: string`
- Bajo `ANY`, la call forzada es `get_weather`
- Bajo `AUTO` sobre un prompt de chiste, el modelo NO llamó la tool

## Concepto extra (opcional)

`NONE` es la tercera opción menos usada — es útil cuando estás reusando las mismas declaraciones a través de muchas calls pero querés apagar el uso de tools para una específica (audit turns, replay de traces, o para forzar al modelo a resumir en vez de actuar).

`ANY` combinado con un `allowedFunctionNames` de un solo elemento es funcionalmente equivalente a "siempre llamá esta función específica" — una forma limpia de expresar "este turn DEBE emitir un form con estos campos".

El track 05 (agents) encadena estos modos: un step de planner bajo `AUTO`, seguido de steps de forced-action bajo `ANY`. Así construís loops de agente deterministic-donde-importa, flexible-donde-ayuda.
