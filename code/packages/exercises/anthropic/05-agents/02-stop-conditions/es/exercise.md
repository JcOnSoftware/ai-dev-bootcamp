# 02 · Condiciones de parada

## Concepto

¿Cuándo debe dejar de iterar un agente? Existen tres condiciones distintas, en orden de prioridad:

| Prioridad | Condición | Por qué |
|-----------|-----------|---------|
| 1 | `max_iterations` | Seguridad — nunca dejes que el agente corra infinitamente |
| 2 | `goal` | El agente señaló explícitamente que completó su tarea |
| 3 | `end_turn` | La API dice que Claude terminó (pero puede no haber alcanzado el objetivo) |

El orden importa. Un agente que alcanzó `end_turn` pero NO completó su objetivo debería continuar si quedan iteraciones. Y un agente que alcanzó el cap de iteraciones debe detenerse incluso si `stop_reason` sigue siendo `"tool_use"`.

**La función `evaluateStop` es pura**: no llama a la API, no tiene efectos secundarios, y es fácil de testear de forma unitaria.

## Objetivo

1. Implementar `evaluateStop(stopReason, content, iterations, maxIterations)` con la prioridad correcta.
2. Implementar `runWithStopConditions(query, maxIterations)` que retorna `{ stoppedReason, calls, finalResponse }`.
3. Incluir en el `system` prompt la instrucción de señalar cuando Claude termina con `"FINAL ANSWER:"`.

## Pasos

1. En `evaluateStop`:
   - Si `iterations >= maxIterations` → retornar `"max_iterations"`.
   - Si `stop_reason === "end_turn"` y algún bloque de texto contiene `"FINAL ANSWER:"` → retornar `"goal"`.
   - Si `stop_reason === "end_turn"` → retornar `"end_turn"`.
   - Caso contrario → retornar `null` (seguir loopeando).
2. En `runWithStopConditions`, llamar `evaluateStop` después de cada respuesta de la API y actuar según el resultado.
3. El `system` prompt debe instruir a Claude a comenzar la respuesta final con `"FINAL ANSWER:"`.

## Concepto extra

En producción, las condiciones de parada se vuelven más sofisticadas: señales de confianza, chequeos de idempotencia, timeouts de reloj de pared. Pero el patrón es siempre el mismo: una función pura y testeable que evalúa el estado del agente y decide si continuar.

## Tests

Los tests verifican:
- `evaluateStop` funciona correctamente para los 4 casos (sin API).
- El número de llamadas está entre 1 y 10.
- El modelo es Haiku.
- Al forzar `maxIterations: 1`, el agente se detiene con `stoppedReason === "max_iterations"` en exactamente 1 llamada.

```bash
AIDEV_TARGET=starter bun test packages/exercises/05-agents/02-stop-conditions
AIDEV_TARGET=solution bun test packages/exercises/05-agents/02-stop-conditions
```

## Recursos

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Implement tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
