# Exercise 02 — Chain multiple tool calls for a multi-step task

## Concepto

El agent loop que construiste en el ejercicio 01 manejaba UNA tool call. Las tareas reales usualmente necesitan varias, EN ORDEN, con el output de cada step alimentando al próximo. Ejemplo: `"Computar (12 * 7) + 9"` — no podés solo llamar `add` primero. Tenés que:

1. `multiply(12, 7)` → 84
2. `add(84, 9)` → 93

El modelo razona sobre esta secuencia. Tu trabajo como autor del agente NO es enseñarle la receta — el loop lo hace naturalmente. Tu trabajo es:

- Darle ambas tools
- Correr el loop suficiente tiempo para acomodar el chaining
- Rutear cada function call al stub correcto (un dispatcher table)

## Docs & referencias

1. [Guía de function calling](https://ai.google.dev/gemini-api/docs/function-calling) — semántica multi-turn
2. [Shape del multi-turn loop](https://ai.google.dev/gemini-api/docs/function-calling#multi-turn) — recordatorio
3. [Prompting para chained reasoning](https://ai.google.dev/gemini-api/docs/prompting-strategies) — tips de Google

## Tu tarea

1. Reusá el loop del ejercicio 01. Incluí AMBAS `multiply` y `add` en `functionDeclarations`.
2. Construí un dispatcher:
   ```ts
   const DISPATCH: Record<string, (args: Record<string, number>) => unknown> = {
     multiply: (a) => multiply(a as { a: number; b: number }),
     add: (a) => add(a as { a: number; b: number }),
   };
   ```
3. En el loop, cuando veas un `functionCall`, ruteá por `DISPATCH[name](args)`.
4. User prompt: `"Compute (12 * 7) + 9 using the tools provided. Show the final number."`
5. Loopeá hasta que no queden function calls. Retorná `{ turnCount, toolCalls, answer }`.

## Cómo verificar

```bash
aidev verify 02-multi-step-task
```

Los tests verifican:
- Al menos 3 llamadas a `generateContent` (turn 1, turn 2, turn 3+)
- Ambas `multiply` y `add` aparecen en `toolCalls`
- **Orden**: `multiply` aparece ANTES que `add` (la única secuencia correcta)
- La respuesta final contiene `93` (el resultado correcto)
- El shape del retorno es `{ turnCount, toolCalls, answer }`

## Concepto extra (opcional)

Dispatcher tables escalan. Cuando vas de 2 tools a 20, cadenas de `if/else` se vuelven ilegibles; un `Record<string, fn>` queda limpio. También hacen el testing unitario fácil — podés sustituir stubs por tool.

El assert de order-matters en los tests revela el razonamiento genuino del modelo. Si el loop falló en cascadear el resultado de multiply al call de add (porque el shape del `functionResponse` era erróneo, o los contents se perdieron entre turns), el modelo o adivinaría o caería a simple suma de los operandos incorrectos. El test "contiene 93" captura todas esas regresiones a la vez.

Para chains más largos (5-10 tools de profundidad), cuidado con **cumulative hallucination**: si una tool retorna garbage, los args de la siguiente tool pueden ser garbage también, y el modelo igual produce una respuesta con tono confiado. Agregá validación en las RESPONSES de tools — si `{ product: NaN }`, parás el loop en vez de feedear data rota adelante.
