# 01 · El bucle del agente

## Concepto

Un agente de IA no es magia: es un **bucle `while`** que envía mensajes a la API, ejecuta herramientas cuando Claude lo pide, y repite hasta que el modelo indica que terminó.

El ciclo se compone de tres fases:

```
  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │   THINK          ACT            OBSERVE         │
  │                                                 │
  │  Claude        Tu código       Claude lee el    │
  │  decide qué    ejecuta la      resultado y      │
  │  herramienta   herramienta     decide qué hacer │
  │  llamar        localmente      a continuación   │
  │                                                 │
  └───────────────────────── (repeat) ─────────────┘
                         ↑
                    stop_reason
                     "end_turn"
                         │
                      DONE ✓
```

La clave es el campo `stop_reason` de la respuesta:

| `stop_reason` | Qué hacer |
|---|---|
| `"tool_use"` | Ejecutar herramientas y devolver resultados |
| `"end_turn"` | Claude terminó — salir del bucle |

**Por qué el cap de iteraciones es obligatorio**: un loop sin techo puede consumir créditos sin límite. `maxIterations: 10` es tu seguro.

## Objetivo

Completar la función `runAgentLoop(query, maxIterations)` en `starter.ts` para que el agente busque en la documentación y responda la pregunta del usuario.

## Pasos

1. Inicializar `messages` con el `query` del usuario como mensaje `"user"`.
2. En cada iteración, llamar `client.messages.create` con `model`, `max_tokens`, `tools` (usa `AGENT_TOOLS`) y `messages`.
3. Si `stop_reason === "end_turn"` → retornar la respuesta.
4. Si `stop_reason === "tool_use"`:
   - Agregar la respuesta del asistente a `messages`.
   - Para cada bloque `tool_use`, llamar `executeTool(name, input)` → string.
   - Agregar un mensaje `"user"` con los bloques `tool_result` correspondientes.
5. Si el bucle supera `maxIterations`, lanzar un error.

## Concepto extra

¿Por qué construir el loop a mano en lugar de usar un framework de agentes? Porque así ves exactamente qué bytes viajan en cada dirección. Frameworks como LangChain o el `toolRunner` de Anthropic SDK son abstracciones útiles, pero ocultan esta mecánica. Un desarrollador senior sabe lo que pasa debajo.

## Tests

Los tests verifican:
- El número de llamadas a la API está entre 1 y 10.
- El primer request incluye las herramientas `search_docs` y `read_chunk`.
- El modelo usado es Haiku.
- La última llamada tiene `stop_reason === "end_turn"`.
- La respuesta final contiene al menos un bloque de texto.
- Al menos una llamada intermedia tiene `stop_reason === "tool_use"`.

```bash
# Ejecutar tests contra tu implementación
AIDEV_TARGET=starter bun test packages/exercises/05-agents/01-agent-loop

# Verificar con la solución
AIDEV_TARGET=solution bun test packages/exercises/05-agents/01-agent-loop
```

## Recursos

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Implement tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
- [Tool use overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
