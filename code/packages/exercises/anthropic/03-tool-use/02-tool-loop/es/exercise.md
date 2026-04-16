# 02 — Tool Loop

## Objetivo

Completar el ciclo de tool use: procesar la respuesta de Claude que contiene un bloque
`tool_use`, ejecutar la función localmente, y alimentar el resultado de vuelta a Claude
en un segundo turno para obtener la respuesta final en texto.

---

## Contexto

En el ejercicio anterior, Claude respondió con `stop_reason === "tool_use"` — pero te
quedaste ahí. Claude está "esperando" que le des el resultado de la herramienta.

El flujo completo de dos turnos es:

```
vos → call 1: messages.create(tools, user_message)
Claude → { stop_reason: "tool_use", content: [..., { type: "tool_use", id, name, input }] }
vos → call 2: messages.create(historia + tool_result)
Claude → { stop_reason: "end_turn", content: [{ type: "text", text: "..." }] }
```

El truco está en construir bien el tercer mensaje (el que contiene `tool_result`):
tiene que incluir el `tool_use_id` que Claude te devolvió en el turno 1.

---

## Tu tarea

1. Implementá `executeGetWeather` — recibe `{ location, unit? }` y retorna un JSON
   string con temperatura y descripción (podés hardcodear valores razonables).
2. Implementá `run()` con el loop de 2 turnos:
   - **Turno 1**: `messages.create` con tools + user message.
   - Extraé el bloque `tool_use` de `response1.content` con `Array.find`.
   - Llamá a `executeGetWeather` con `toolUseBlock.input`.
   - **Turno 2**: `messages.create` con el historial completo + un mensaje `user`
     que tenga `[{ type: "tool_result", tool_use_id: toolUseBlock.id, content: resultado }]`.
3. Retorná `response2`.

---

## Pistas

- El historial del turno 2 es: `[userMessage, { role: "assistant", content: response1.content }, { role: "user", content: [toolResult] }]`.
- `tool_use_id` debe coincidir exactamente con `toolUseBlock.id` — Claude lo usa para saber a qué llamada corresponde.
- Si Claude llama a una herramienta que no reconocés, podés lanzar un error informativo.
- El turno 2 no necesita `tool_choice` — Claude sabe que ya recibió el resultado.

---

## Criterios de éxito

Los tests verifican:

- `executeGetWeather` retorna un JSON string con `temperature` numérico (test unitario, sin API).
- `calls.length === 2` — exactamente dos llamadas a la API.
- `calls[0].response.content` contiene un bloque `tool_use`.
- El último mensaje `user` en `calls[1].request.messages` contiene un `tool_result`
  cuyo `tool_use_id` coincide con el `id` del bloque `tool_use` del turno 1.
- `calls[1].response.stop_reason === "end_turn"`.
- El modelo es haiku.

---

## Recursos

- [Tool use — Overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)
- [Tool use — Implementación](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)
