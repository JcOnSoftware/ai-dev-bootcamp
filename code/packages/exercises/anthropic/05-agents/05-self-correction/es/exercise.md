# 05 · Autocorrección

## Concepto

Los agentes en producción se encuentran con errores: IDs inexistentes, APIs caídas, respuestas malformadas. Un agente robusto no se rinde — **detecta el error y prueba una estrategia diferente**.

La herramienta `read_chunk` retorna `{ error: "Chunk not found: ..." }` cuando el ID no existe. Si el agente reintenta con el mismo ID, entra en un loop inútil. La solución es instruir explícitamente al modelo para que cambie de enfoque ante un error.

**Mecanismo**: el `system` prompt incluye la regla:
> "Si alguna herramienta retorna `{ error }`, debés intentar un enfoque DIFERENTE en lugar de reintentar la misma llamada."

Esta instrucción es suficiente para que Claude detecte el JSON de error en el `tool_result` y cambie su plan.

## Objetivo

Implementar `runSelfCorrecting(query, maxIterations)` con un `system` prompt que instruya la recuperación de errores. La query de `run()` pide leer `"nonexistent-id"` primero, forzando al agente a encontrar un error y luego buscar una alternativa válida.

## Pasos

1. Definir el `system` prompt con la regla de error explícita.
2. Implementar el agent loop igual que en ejercicios anteriores.
3. El `executeTool` ya retorna `{ error: ... }` automáticamente para IDs inexistentes — no necesitás código especial.

## Concepto extra

**`disable_parallel_tool_use`**: si querés que los errores sean predecibles y secuenciales, podés agregar `disable_parallel_tool_use: true` al request. Esto fuerza a Claude a llamar una herramienta por vez, haciendo que el error del primer `read_chunk` se propague antes de que intente más herramientas. Útil para debugging y para flujos donde el orden importa.

La API del SDK de Anthropic también tiene `beta.messages.toolRunner()` que maneja el loop por vos — pero como vimos en el ejercicio 01, construirlo a mano te da control total sobre cómo manejar errores y recuperación.

## Tests

Los tests verifican:
- Al menos 2 llamadas a la API.
- El `system` prompt contiene instrucción sobre errores ("error" + "different"/"another"/"try").
- Al menos un `tool_result` en la conversación contiene `{"error":` (la recuperación se disparó).
- `read_chunk` fue llamado con al menos 2 IDs distintos (el fallido y el de recuperación).
- La respuesta final es `end_turn` con texto.

```bash
AIDEV_TARGET=starter bun test packages/exercises/05-agents/05-self-correction
AIDEV_TARGET=solution bun test packages/exercises/05-agents/05-self-correction
```

## Recursos

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Tool results and errors](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
- [Tool use overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
