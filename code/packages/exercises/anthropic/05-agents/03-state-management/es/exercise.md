# 03 · Gestión de estado

## Concepto

La API de Anthropic es **stateless**: cada request debe incluir el historial completo de la conversación. No hay sesión del lado del servidor que recordar. Tu código es dueño del estado.

Esto tiene implicaciones importantes:

- El array `messages` crece con cada turno — necesitás acumularlo correctamente.
- Agregar la respuesta del asistente al historial es obligatorio antes de iniciar el siguiente turno.
- Si olvidás incluir el historial previo, Claude "olvida" todo lo que pasó antes.

Un **turno** en este contexto es una pregunta del usuario resuelta completamente (puede requerir múltiples llamadas internas a la API para resolver tool uses). El array de mensajes se muta in-place para acumular el historial entre turnos.

## Objetivo

Implementar `runTurn(state, userMsg, maxIterations)` que:
1. Agrega el mensaje del usuario al estado.
2. Ejecuta el agent loop hasta obtener `end_turn`.
3. Agrega la respuesta final del asistente al estado (para el siguiente turno).
4. Retorna la respuesta final.

## Pasos

1. Definir `ConversationState` con `messages: Anthropic.MessageParam[]` y `totalIterations: number`.
2. En `runTurn`, hacer `state.messages.push({ role: "user", content: userMsg })`.
3. Ejecutar el agent loop usando `state.messages` como contexto (igual que ejercicio 01, pero con historial acumulado).
4. Antes de retornar la respuesta final, agregar la respuesta del asistente al estado: `state.messages.push({ role: "assistant", content: response.content })`.
5. En `run()`, crear el estado inicial y llamar `runTurn` dos veces con preguntas relacionadas.

## Concepto extra

En aplicaciones reales, el estado de la conversación se serializa (JSON, base de datos) para sobrevivir entre requests HTTP. El patrón es el mismo: un array plano de mensajes que crece monotónicamente. La gestión de memoria (truncación, resúmenes) viene después.

## Tests

Los tests verifican:
- Al menos 2 llamadas a la API (2 turnos).
- El número total de llamadas está entre 2 y 15.
- El segundo turno incluye mensajes del primero (historial acumulado).
- El último request tiene al menos 4 mensajes.
- La respuesta final es `end_turn` con texto.

```bash
AIDEV_TARGET=starter bun test packages/exercises/05-agents/03-state-management
AIDEV_TARGET=solution bun test packages/exercises/05-agents/03-state-management
```

## Recursos

- [Agents overview](https://docs.claude.com/en/docs/agents-and-tools/overview)
- [Implement tool use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
- [Messages API reference](https://docs.claude.com/en/api/messages)
